import { UserRole } from 'src/common/enums/user-role.enum';
import {
  user_role_name_enum,
  UserRole as UserRoleRecord,
} from 'src/generated/prisma/client';

function mapPrismaRoleToUserRole(role: user_role_name_enum): UserRole {
  return role as UserRole;
}

export function extractUserRoles(user: {
  userRoles: Pick<UserRoleRecord, 'role'>[];
}): UserRole[] {
  return user.userRoles.map((userRole) =>
    mapPrismaRoleToUserRole(userRole.role),
  );
}

export function hasAnyRole(
  userRoles: UserRole[],
  requiredRoles: UserRole[],
): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}

function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role);
}

export function isSuperAdmin(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, UserRole.SUPER_ADMIN);
}
