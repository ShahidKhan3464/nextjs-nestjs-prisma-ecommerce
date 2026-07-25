"use client";

import type { UserRole } from "@/modules/auth";
import { isSuperAdmin } from "@/modules/auth/utils/roles";
import { AdminAppShell } from "@/shared/components/layout/admin-app-shell";
import { CustomerAppShell } from "@/shared/components/layout/customer-app-shell";

type Props = {
  roles: UserRole[];
  children: React.ReactNode;
};

/** Picks account chrome by session roles; shop routes are auth-gated in middleware. */
export function ShopRoleShell({ roles, children }: Props) {
  if (isSuperAdmin(roles)) {
    return <AdminAppShell>{children}</AdminAppShell>;
  }
  return <CustomerAppShell>{children}</CustomerAppShell>;
}
