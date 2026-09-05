import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { AuditActionValue } from './audit.constants';
import { isSuperAdmin } from 'src/common/utils/authorization.util';
import { getRequestContext } from 'src/common/request-context/request-context';

export type AuditWriteInput = {
  entityType: string;
  action: AuditActionValue;
  entityId: string | number;
  after?: Prisma.InputJsonValue | null;
  before?: Prisma.InputJsonValue | null;
};

/**
 * Append-only audit writer. Never logs secrets (passwords, tokens, card data).
 * Failures are swallowed so audit never blocks money/admin paths.
 */
@Injectable()
export class AuditProvider {
  private readonly logger = new Logger(AuditProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditWriteInput): void {
    const ctx = getRequestContext();
    const actorRole = this.resolveActorRole(ctx.roles);

    void this.prisma.auditLog
      .create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: String(input.entityId),
          actorId: ctx.userId ?? null,
          actorRole,
          before: input.before ?? Prisma.DbNull,
          after: input.after ?? Prisma.DbNull,
          requestId: ctx.requestId ?? null,
          ip: ctx.ip ?? null,
        },
      })
      .catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Audit write failed for ${input.action} ${input.entityType}:${input.entityId}: ${detail}`,
        );
      });
  }

  private resolveActorRole(
    roles: ReturnType<typeof getRequestContext>['roles'],
  ): string | null {
    if (!roles || roles.length === 0) {
      return null;
    }
    if (isSuperAdmin(roles)) {
      return 'SUPER_ADMIN';
    }
    return roles[0] ?? null;
  }
}
