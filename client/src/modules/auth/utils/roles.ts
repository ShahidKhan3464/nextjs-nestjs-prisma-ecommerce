import { USER_ROLES, type UserRole } from "../types";

const USER_ROLE_SET = new Set<string>(USER_ROLES);

/** Normalize unknown Nest/JWT role values into a valid `UserRole[]`. */
export function normalizeRoles(roles: unknown): UserRole[] {
  if (!Array.isArray(roles)) return [];
  const seen = new Set<UserRole>();
  const result: UserRole[] = [];
  for (const value of roles) {
    if (typeof value !== "string" || !USER_ROLE_SET.has(value)) continue;
    const role = value as UserRole;
    if (seen.has(role)) continue;
    seen.add(role);
    result.push(role);
  }
  return result;
}

function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role);
}

export function isSeller(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "SELLER");
}

export function isBuyer(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "BUYER");
}

export function isSuperAdmin(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, "SUPER_ADMIN");
}
