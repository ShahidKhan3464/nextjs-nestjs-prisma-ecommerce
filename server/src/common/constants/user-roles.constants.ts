import { Prisma } from 'src/generated/prisma/client';

export const USER_ROLES_INCLUDE = {
  userRoles: { select: { role: true } },
} satisfies Prisma.UserInclude;
