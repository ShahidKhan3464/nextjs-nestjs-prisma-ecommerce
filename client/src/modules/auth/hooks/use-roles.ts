"use client";

import type { UserRole } from "../types";
import { useAuthStore } from "@/store/auth-store";
import {
  hasAnyRole,
  hasRole,
  isBuyer,
  isSeller,
  isSuperAdmin,
} from "../utils/roles";

export function useUserRoles(): UserRole[] {
  return useAuthStore((s) => s.user?.roles ?? []);
}

export function useHasRole(role: UserRole): boolean {
  const roles = useUserRoles();
  return hasRole(roles, role);
}

export function useHasAnyRole(requiredRoles: UserRole[]): boolean {
  const roles = useUserRoles();
  return hasAnyRole(roles, requiredRoles);
}

export function useIsSeller(): boolean {
  return isSeller(useUserRoles());
}

export function useIsBuyer(): boolean {
  return isBuyer(useUserRoles());
}

export function useIsSuperAdmin(): boolean {
  return isSuperAdmin(useUserRoles());
}
