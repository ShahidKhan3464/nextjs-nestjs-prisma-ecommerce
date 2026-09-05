"use client";

import { useMemo } from "react";
import type { UserRole } from "@/modules/auth";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { RoleAppShell } from "@/shared/components/layout/role-app-shell";
import { fetchAdminAnalytics } from "@/modules/admin/dashboard/services/analytics.service";
import { getNavForRoles, shopChromeTitle } from "@/shared/navigation/app-nav";

type Props = {
  roles: UserRole[];
  children: React.ReactNode;
};

export function AdminAppShell({ roles, children }: Props) {
  const { data } = useQuery({
    queryKey: queryKeys.admin.analytics,
    queryFn: fetchAdminAnalytics,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const pendingSellerApprovals = data?.totals.pendingSellerApprovals ?? 0;

  const nav = useMemo(() => {
    return getNavForRoles(roles).map((item) =>
      item.id === "seller-profiles" && pendingSellerApprovals > 0
        ? { ...item, badge: pendingSellerApprovals }
        : item
    );
  }, [roles, pendingSellerApprovals]);

  return (
    <RoleAppShell
      nav={nav}
      showMobileNav
      sidebarVisibleFrom="lg"
      sidebarId="admin-sidebar"
      sidebarAriaLabel="Admin navigation"
      portalTitle={shopChromeTitle("admin")}
      mobileAriaLabel="Mobile admin navigation"
    >
      {children}
    </RoleAppShell>
  );
}
