import { Prisma } from 'src/generated/prisma/client';
import { PaymentStatus } from '../constants/payment.constants';
import { Injectable, BadRequestException } from '@nestjs/common';
import { assertPaymentStatusTransition } from '../utils/payment-status-transitions.util';

type TxClient = Prisma.TransactionClient;

export type MarkSucceededInput = {
  orderIds: number[];
  methodSummary: string;
  paidAt?: Date;
};

export type MarkFailedInput = {
  paymentIds: number[];
  failureReason: string;
};

export type MarkCancelledInput = {
  paymentIds: number[];
  failureReason?: string;
};

export type ApplyRefundInput = {
  paymentId: number;
  /** Absolute refund amount for this operation (not cumulative). */
  amount: number;
  reason: string;
  externalRefundId?: string | null;
  refundedAt?: Date;
};

/**
 * Centralizes payment status writes so checkout/webhooks/COD stay consistent.
 * Callers pass a transaction client when Payment must update atomically with Order.
 */
@Injectable()
export class PaymentLifecycleProvider {
  async markSucceededMany(
    tx: TxClient,
    input: MarkSucceededInput,
  ): Promise<number> {
    if (input.orderIds.length === 0) {
      return 0;
    }

    const result = await tx.payment.updateMany({
      where: {
        orderId: { in: input.orderIds },
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },
      data: {
        status: PaymentStatus.SUCCEEDED,
        methodSummary: input.methodSummary,
        paidAt: input.paidAt ?? new Date(),
        failureReason: null,
      },
    });

    return result.count;
  }

  async markFailedMany(tx: TxClient, input: MarkFailedInput): Promise<number> {
    if (input.paymentIds.length === 0) {
      return 0;
    }

    const payments = await tx.payment.findMany({
      where: { id: { in: input.paymentIds } },
      select: { id: true, status: true },
    });

    for (const payment of payments) {
      assertPaymentStatusTransition(
        payment.status as PaymentStatus,
        PaymentStatus.FAILED,
      );
    }

    const result = await tx.payment.updateMany({
      where: {
        id: { in: input.paymentIds },
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: input.failureReason,
      },
    });

    return result.count;
  }

  async markCancelledMany(
    tx: TxClient,
    input: MarkCancelledInput,
  ): Promise<number> {
    if (input.paymentIds.length === 0) {
      return 0;
    }

    const result = await tx.payment.updateMany({
      where: {
        id: { in: input.paymentIds },
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },
      data: {
        status: PaymentStatus.CANCELLED,
        failureReason: input.failureReason ?? null,
      },
    });

    return result.count;
  }

  async markProcessingByTransactionId(
    tx: TxClient,
    transactionId: string,
  ): Promise<number> {
    const result = await tx.payment.updateMany({
      where: {
        transactionId,
        status: PaymentStatus.PENDING,
      },
      data: { status: PaymentStatus.PROCESSING },
    });

    return result.count;
  }

  /**
   * Idempotent provider-callback sync: already-succeeded payments are a no-op.
   * Used by complete-checkout today and future webhook handlers.
   */
  async syncSucceededByTransactionId(
    tx: TxClient,
    transactionId: string,
    input: { methodSummary: string; paidAt?: Date; userId?: number },
  ): Promise<{ orderIds: number[]; updatedCount: number }> {
    const existingSucceeded = await tx.payment.findMany({
      where: {
        transactionId,
        status: PaymentStatus.SUCCEEDED,
        ...(input.userId !== undefined
          ? { order: { userId: input.userId } }
          : {}),
      },
      select: { orderId: true },
    });

    if (existingSucceeded.length > 0) {
      return {
        orderIds: existingSucceeded.map((p) => p.orderId),
        updatedCount: 0,
      };
    }

    const pending = await tx.payment.findMany({
      where: {
        transactionId,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
        ...(input.userId !== undefined
          ? { order: { userId: input.userId, status: 'PENDING' } }
          : {}),
      },
      select: { orderId: true },
    });

    const orderIds = pending.map((p) => p.orderId);
    const updatedCount = await this.markSucceededMany(tx, {
      orderIds,
      methodSummary: input.methodSummary,
      paidAt: input.paidAt,
    });

    return { orderIds, updatedCount };
  }

  async applyRefund(tx: TxClient, input: ApplyRefundInput): Promise<void> {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    const amount = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundedAmount);
    const remaining = amount - alreadyRefunded;

    if (input.amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    if (input.amount > remaining + 1e-9) {
      throw new BadRequestException(
        'Refund amount exceeds the remaining refundable balance',
      );
    }

    const nextRefunded =
      Math.round((alreadyRefunded + input.amount) * 100) / 100;
    const nextStatus =
      nextRefunded >= amount - 1e-9
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED;

    assertPaymentStatusTransition(payment.status as PaymentStatus, nextStatus);

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        refundedAmount: nextRefunded,
        refundReason: input.reason,
        refundedAt: input.refundedAt ?? new Date(),
        externalRefundId: input.externalRefundId ?? payment.externalRefundId,
      },
    });
  }

  /**
   * Marks an unpaid payment as failed (e.g. unpaid order cancel).
   * Idempotent when already FAILED.
   */
  async markFailedOrKeep(
    tx: TxClient,
    paymentId: number,
    failureReason: string,
  ): Promise<void> {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true },
    });

    if (!payment) {
      return;
    }

    if ((payment.status as PaymentStatus) === PaymentStatus.FAILED) {
      return;
    }

    assertPaymentStatusTransition(
      payment.status as PaymentStatus,
      PaymentStatus.FAILED,
    );

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        failureReason,
      },
    });
  }
}
