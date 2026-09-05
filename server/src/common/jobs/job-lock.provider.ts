import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Postgres-native single-flight lock (pool-safe).
 * Uses a TTL so a crashed instance cannot hold the lock forever.
 */
@Injectable()
export class JobLockProvider {
  constructor(private readonly prisma: PrismaService) {}

  async tryAcquire(name: string, ttlMs: number): Promise<boolean> {
    const lockedUntil = new Date(Date.now() + ttlMs);
    const rows = await this.prisma.$queryRaw<Array<{ name: string }>>`
      INSERT INTO job_locks (name, "lockedUntil", "updatedAt")
      VALUES (${name}, ${lockedUntil}, NOW())
      ON CONFLICT (name) DO UPDATE
        SET "lockedUntil" = EXCLUDED."lockedUntil",
            "updatedAt" = NOW()
      WHERE job_locks."lockedUntil" < NOW()
      RETURNING name
    `;
    return rows.length > 0;
  }

  async release(name: string): Promise<void> {
    await this.prisma.jobLock
      .updateMany({
        where: { name },
        data: { lockedUntil: new Date(0) },
      })
      .catch(() => undefined);
  }

  async runExclusive<T>(
    name: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    const acquired = await this.tryAcquire(name, ttlMs);
    if (!acquired) {
      return undefined;
    }
    try {
      return await fn();
    } finally {
      await this.release(name);
    }
  }
}
