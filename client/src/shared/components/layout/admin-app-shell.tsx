"use client";

import type { UserRole } from "@/modules/auth";
import { RoleAppShell } from "@/shared/components/layout/role-app-shell";
import {
  getNavForRoles,
  shopChromeTitle,
} from "@/shared/navigation/app-nav";

type Props = {
  roles: UserRole[];
  children: React.ReactNode;
};

export function AdminAppShell({ roles, children }: Props) {
  return (
    <RoleAppShell
      showMobileNav
      sidebarVisibleFrom="lg"
      sidebarId="admin-sidebar"
      nav={getNavForRoles(roles)}
      sidebarAriaLabel="Admin navigation"
      portalTitle={shopChromeTitle("admin")}
      mobileAriaLabel="Mobile admin navigation"
    >
      {children}
    </RoleAppShell>
  );
}
