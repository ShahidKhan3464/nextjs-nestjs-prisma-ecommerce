import { Prisma } from 'src/generated/prisma/client';

export const AUTH_USER_SELECT = {
  id: true,
  email: true,
  isBlocked: true,
  deletedAt: true,
  userRoles: { select: { role: true } },
} satisfies Prisma.UserSelect;

export type AuthUserWithRoles = Prisma.UserGetPayload<{
  select: typeof AUTH_USER_SELECT;
}>;
