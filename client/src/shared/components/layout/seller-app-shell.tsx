"use client";

import type { UserRole } from "@/modules/auth";
import { RoleAppShell } from "@/shared/components/layout/role-app-shell";
import { getNavForRoles, shopChromeTitle } from "@/shared/navigation/app-nav";

type Props = {
  roles: UserRole[];
  children: React.ReactNode;
};

export function SellerAppShell({ roles, children }: Props) {
  return (
    <RoleAppShell
      showMobileNav
      sidebarVisibleFrom="md"
      sidebarId="seller-sidebar"
      nav={getNavForRoles(roles)}
      sidebarAriaLabel="Seller navigation"
      portalTitle={shopChromeTitle("seller")}
      mobileAriaLabel="Mobile seller navigation"
    >
      {children}
    </RoleAppShell>
  );
}
