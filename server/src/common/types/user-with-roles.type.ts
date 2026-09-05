import { User, UserRole as UserRoleRecord } from 'src/generated/prisma/client';

export type UserWithRoles = User & {
  userRoles: Pick<UserRoleRecord, 'role'>[];
};
