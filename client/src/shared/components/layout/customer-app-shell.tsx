"use client";

import type { UserRole } from "@/modules/auth";
import { RoleAppShell } from "@/shared/components/layout/role-app-shell";
import { getNavForRoles, shopChromeTitle } from "@/shared/navigation/app-nav";

type Props = {
  roles: UserRole[];
  children: React.ReactNode;
};

export function CustomerAppShell({ roles, children }: Props) {
  return (
    <RoleAppShell
      showMobileNav
      sidebarVisibleFrom="md"
      nav={getNavForRoles(roles)}
      sidebarId="customer-sidebar"
      sidebarAriaLabel="Buyer navigation"
      portalTitle={shopChromeTitle("buyer")}
      mobileAriaLabel="Mobile buyer navigation"
    >
      {children}
    </RoleAppShell>
  );
}
