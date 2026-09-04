import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CheckoutSessionResponse } from '../types/order.types';
import type { ShippingAddressDto } from '../dto/create-checkout.dto';
import {
  Injectable,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  sleep,
  hashCheckoutRequest,
  CHECKOUT_IDEMPOTENCY_TTL_MS,
  CHECKOUT_IDEMPOTENCY_IN_FLIGHT_MS,
} from '../utils/checkout-idempotency.util';

type IdempotencyRow = {
  id: number;
  createdAt: Date;
  requestHash: string;
  completedAt: Date | null;
  responseJson: Prisma.JsonValue | null;
};

/**
 * Durable checkout idempotency using PostgreSQL unique (userId, key).
 * Concurrent requests with the same key cannot both create a checkout.
 */
@Injectable()
export class CheckoutIdempotencyProvider {
  constructor(private readonly prisma: PrismaService) {}

  hashRequest(shippingAddress: ShippingAddressDto): string {
    return hashCheckoutRequest(shippingAddress);
  }

  async begin(
    userId: number,
    key: string,
    requestHash: string,
  ): Promise<CheckoutSessionResponse | 'proceed'> {
    try {
      await this.prisma.checkoutIdempotencyKey.create({
        data: { userId, key, requestHash },
      });
      return 'proceed';
    } catch (err) {
      if (!isUniqueConstraintError(err)) {
        throw err;
      }
    }

    return this.waitForExisting(userId, key, requestHash);
  }

  async complete(
    userId: number,
    key: string,
    response: CheckoutSessionResponse,
  ): Promise<void> {
    await this.prisma.checkoutIdempotencyKey.updateMany({
      where: { userId, key },
      data: {
        responseJson: response,
        completedAt: new Date(),
      },
    });
  }

  async abort(userId: number, key: string): Promise<void> {
    await this.prisma.checkoutIdempotencyKey.deleteMany({
      where: { userId, key, completedAt: null },
    });
  }

  private async waitForExisting(
    userId: number,
    key: string,
    requestHash: string,
  ): Promise<CheckoutSessionResponse | 'proceed'> {
    const deadline = Date.now() + 4_000;

    while (Date.now() < deadline) {
      const row = await this.findRow(userId, key);
      if (!row) {
        try {
          await this.prisma.checkoutIdempotencyKey.create({
            data: { userId, key, requestHash },
          });
          return 'proceed';
        } catch (err) {
          if (isUniqueConstraintError(err)) {
            await sleep(150);
            continue;
          }
          throw err;
        }
      }

      this.assertSameRequest(row, requestHash);

      if (this.isExpired(row)) {
        await this.prisma.checkoutIdempotencyKey.deleteMany({
          where: { id: row.id },
        });
        continue;
      }

      const stored = this.readStoredResponse(row);
      if (stored) {
        return stored;
      }

      if (this.isStaleInFlight(row)) {
        await this.prisma.checkoutIdempotencyKey.deleteMany({
          where: { id: row.id, completedAt: null },
        });
        continue;
      }

      await sleep(150);
    }

    throw new ServiceUnavailableException(
      'A checkout with this idempotency key is already in progress',
    );
  }

  private async findRow(
    userId: number,
    key: string,
  ): Promise<IdempotencyRow | null> {
    return this.prisma.checkoutIdempotencyKey.findUnique({
      where: {
        userId_key: { userId, key },
      },
      select: {
        id: true,
        requestHash: true,
        responseJson: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }

  private assertSameRequest(row: IdempotencyRow, requestHash: string): void {
    if (row.requestHash !== requestHash) {
      throw new ConflictException(
        'Idempotency key was already used with a different checkout request',
      );
    }
  }

  private isExpired(row: IdempotencyRow): boolean {
    return Date.now() - row.createdAt.getTime() > CHECKOUT_IDEMPOTENCY_TTL_MS;
  }

  private isStaleInFlight(row: IdempotencyRow): boolean {
    return (
      !row.completedAt &&
      Date.now() - row.createdAt.getTime() > CHECKOUT_IDEMPOTENCY_IN_FLIGHT_MS
    );
  }

  private readStoredResponse(
    row: IdempotencyRow,
  ): CheckoutSessionResponse | null {
    if (!row.responseJson || typeof row.responseJson !== 'object') {
      return null;
    }
    const value = row.responseJson as unknown as CheckoutSessionResponse;
    if (
      typeof value.clientSecret !== 'string' ||
      typeof value.paymentIntentId !== 'string' ||
      typeof value.checkoutSessionId !== 'string'
    ) {
      return null;
    }
    return value;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return false;
  }
  return err.code === 'P2002';
}
