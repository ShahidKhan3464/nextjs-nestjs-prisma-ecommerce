import { UserRole } from 'src/common/enums/user-role.enum';
import { user_role_name_enum } from 'src/generated/prisma/client';
import { UserWithRoles } from 'src/common/types/user-with-roles.type';

export function mapPrismaRoleToUserRole(role: user_role_name_enum): UserRole {
  return role as UserRole;
}

export function extractUserRoles(user: UserWithRoles): UserRole[] {
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

export function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role);
}

export function isSuperAdmin(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, UserRole.SUPER_ADMIN);
}

export function resolvePrimaryRole(userRoles: UserRole[]): UserRole {
  if (hasRole(userRoles, UserRole.SUPER_ADMIN)) {
    return UserRole.SUPER_ADMIN;
  }

  if (hasRole(userRoles, UserRole.SELLER)) {
    return UserRole.SELLER;
  }

  return UserRole.BUYER;
}
