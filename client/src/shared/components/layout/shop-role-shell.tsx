"use client";

import { AdminAppShell } from "@/shared/components/layout/admin-app-shell";
import { CustomerAppShell } from "@/shared/components/layout/customer-app-shell";

type Props = {
  role: "admin" | "customer";
  children: React.ReactNode;
};

/** Picks account chrome by JWT role; shop routes are auth-gated in middleware. */
export function ShopRoleShell({ role, children }: Props) {
  if (role === "admin") {
    return <AdminAppShell>{children}</AdminAppShell>;
  }
  return <CustomerAppShell>{children}</CustomerAppShell>;
}
