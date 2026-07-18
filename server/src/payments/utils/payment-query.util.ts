import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentWithOrder } from '../utils/map-payment.util';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { PaymentProvider } from 'src/common/enums/payment-provider.enum';

const PAYMENT_LIST_SELECT = {
  id: true,
  amount: true,
  paidAt: true,
  status: true,
  orderId: true,
  currency: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
  refundedAt: true,
  refundReason: true,
  transactionId: true,
  failureReason: true,
  methodSummary: true,
  refundedAmount: true,
  externalRefundId: true,
  order: {
    select: {
      id: true,
      userId: true,
      storeId: true,
      orderNumber: true,
    },
  },
} as const;

function mapPaymentRow(payment: {
  id: number;
  orderId: number;
  provider: string;
  transactionId: string | null;
  failureReason: string | null;
  amount: unknown;
  currency: string;
  status: string;
  methodSummary: string | null;
  paidAt: Date | null;
  refundedAmount: unknown;
  refundReason: string | null;
  refundedAt: Date | null;
  externalRefundId: string | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: number;
    orderNumber: string;
    storeId: number;
    userId: number;
  };
}): PaymentWithOrder {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider as PaymentProvider,
    transactionId: payment.transactionId,
    failureReason: payment.failureReason,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status as PaymentStatus,
    methodSummary: payment.methodSummary,
    paidAt: payment.paidAt,
    refundedAmount: Number(payment.refundedAmount),
    refundReason: payment.refundReason,
    refundedAt: payment.refundedAt,
    externalRefundId: payment.externalRefundId,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    order: payment.order,
  };
}

/**
 * Loads payments with a minimal order summary (no line items / N+1).
 */
export async function findPaymentsWithOrder(
  prisma: PrismaService,
  args: Parameters<PrismaService['payment']['findMany']>[0] = {},
): Promise<PaymentWithOrder[]> {
  const {
    include: _ignoredInclude,
    select: _ignoredSelect,
    ...rest
  } = args ?? {};

  const payments = await prisma.payment.findMany({
    ...rest,
    select: PAYMENT_LIST_SELECT,
  });

  return payments.map(mapPaymentRow);
}

export async function findPaymentWithOrder(
  prisma: PrismaService,
  where: { id: number },
): Promise<PaymentWithOrder | null> {
  const payments = await findPaymentsWithOrder(prisma, { where, take: 1 });
  return payments[0] ?? null;
}
