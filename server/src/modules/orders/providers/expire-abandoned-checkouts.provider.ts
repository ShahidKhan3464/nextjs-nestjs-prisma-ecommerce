import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { adjustVariantStock } from '../utils/adjust-variant-stock.util';
import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  CheckoutSessionStatus,
} from '../constants/order.constants';
import {
  StripeClient,
  StripeService,
} from 'src/integrations/stripe/stripe.service';

/** Pending checkouts older than this release reserved stock. */
export const CHECKOUT_ABANDON_TTL_MS = 30 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

type CheckoutSessionRow = {
  id: number;
  userId: number;
  createdAt: Date;
  stripePaymentIntentId: string;
};

@Injectable()
export class ExpireAbandonedCheckoutsProvider
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ExpireAbandonedCheckoutsProvider.name);
  private readonly stripe: StripeClient;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    stripeService: StripeService,
  ) {
    this.stripe = stripeService.client;
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.expireStale().catch((err) => {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Abandoned checkout sweep failed: ${detail}`);
      });
    }, SWEEP_INTERVAL_MS);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Expire all pending sessions past TTL (global sweep). */
  async expireStale(): Promise<number> {
    const cutoff = new Date(Date.now() - CHECKOUT_ABANDON_TTL_MS);
    const staleSessions = await this.prisma.checkoutSession.findMany({
      where: {
        status: CheckoutSessionStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        stripePaymentIntentId: true,
      },
    });

    let expired = 0;
    for (const session of staleSessions) {
      const released = await this.expireSession(session);
      if (released) expired += 1;
    }
    if (expired > 0) {
      this.logger.log(`Expired ${expired} abandoned checkout session(s)`);
    }
    return expired;
  }

  /** Clear a user's pending checkouts before starting a new one. */
  async clearForUser(userId: number): Promise<void> {
    const existingSessions = await this.prisma.checkoutSession.findMany({
      where: {
        userId,
        status: CheckoutSessionStatus.PENDING,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        stripePaymentIntentId: true,
      },
    });

    for (const session of existingSessions) {
      await this.expireSession(session);
    }
  }

  private async expireSession(session: CheckoutSessionRow): Promise<boolean> {
    const piId = session.stripePaymentIntentId;
    if (piId && piId !== 'pending') {
      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(piId);
        if (
          paymentIntent.status === 'succeeded' ||
          paymentIntent.status === 'processing'
        ) {
          return false;
        }

        if (
          paymentIntent.status === 'requires_payment_method' ||
          paymentIntent.status === 'requires_confirmation' ||
          paymentIntent.status === 'requires_action' ||
          paymentIntent.status === 'requires_capture'
        ) {
          await this.stripe.paymentIntents.cancel(piId).catch(() => undefined);
        }
      } catch {
        /* continue cleanup for unreachable PI lookups */
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.checkoutSession.updateMany({
        where: {
          id: session.id,
          status: CheckoutSessionStatus.PENDING,
        },
        data: { status: CheckoutSessionStatus.EXPIRED },
      });

      if (claimed.count === 0) {
        return;
      }

      const orderIds = await this.resolvePendingOrderIds(tx, session);

      if (orderIds.length > 0) {
        const items = await tx.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { variantId: true, quantity: true },
        });
        await adjustVariantStock(tx, items, 'release');
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        return;
      }

      const sessionItems = await tx.checkoutSessionItem.findMany({
        where: { checkoutSessionId: session.id },
        select: { variantId: true, quantity: true },
      });
      if (sessionItems.length > 0) {
        await adjustVariantStock(tx, sessionItems, 'release');
      }
    });

    return true;
  }

  private async resolvePendingOrderIds(
    tx: Prisma.TransactionClient,
    session: CheckoutSessionRow,
  ): Promise<number[]> {
    const piId = session.stripePaymentIntentId;

    if (piId && piId !== 'pending') {
      const payments = await tx.payment.findMany({
        where: {
          transactionId: piId,
          status: PaymentStatus.PENDING,
          order: { userId: session.userId, status: OrderStatus.PENDING },
        },
        select: { orderId: true },
      });
      return [...new Set(payments.map((p) => p.orderId))];
    }

    // Session never got a PaymentIntent — match pending orders created with it
    // (same user, within a short window of session.createdAt).
    const windowMs = 60_000;
    const payments = await tx.payment.findMany({
      where: {
        transactionId: 'pending',
        status: PaymentStatus.PENDING,
        order: {
          userId: session.userId,
          status: OrderStatus.PENDING,
          createdAt: {
            gte: new Date(session.createdAt.getTime() - windowMs),
            lte: new Date(session.createdAt.getTime() + windowMs),
          },
        },
      },
      select: { orderId: true },
    });
    return [...new Set(payments.map((p) => p.orderId))];
  }
}
