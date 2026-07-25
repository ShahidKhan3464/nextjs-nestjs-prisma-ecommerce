"use client";

import type { UserRole } from "@/modules/auth";
import { resolveShopChrome } from "@/shared/navigation/app-nav";
import { AdminAppShell } from "@/shared/components/layout/admin-app-shell";
import { SellerAppShell } from "@/shared/components/layout/seller-app-shell";
import { CustomerAppShell } from "@/shared/components/layout/customer-app-shell";

type Props = {
  roles: UserRole[];
  children: React.ReactNode;
};

/** Picks account chrome by session roles; shop routes are auth-gated in middleware. */
export function ShopRoleShell({ roles, children }: Props) {
  const chrome = resolveShopChrome(roles);

  if (chrome === "admin") {
    return <AdminAppShell roles={roles}>{children}</AdminAppShell>;
  }
  if (chrome === "seller") {
    return <SellerAppShell roles={roles}>{children}</SellerAppShell>;
  }
  return <CustomerAppShell roles={roles}>{children}</CustomerAppShell>;
}
