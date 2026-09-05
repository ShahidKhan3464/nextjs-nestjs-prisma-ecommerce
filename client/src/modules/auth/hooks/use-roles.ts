"use client";

import type { UserRole } from "../types";
import { isSeller } from "../utils/roles";
import { useAuthStore } from "@/store/auth-store";

const EMPTY_ROLES: UserRole[] = [];

export function useUserRoles(): UserRole[] {
  return useAuthStore((s) => s.user?.roles ?? EMPTY_ROLES);
}

export function useIsSeller(): boolean {
  return isSeller(useUserRoles());
}
