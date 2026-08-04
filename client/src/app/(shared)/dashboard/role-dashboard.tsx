"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";
import type { UserRole } from "@/modules/auth";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

const AdminAnalytics = dynamic(
  () =>
    import("@/modules/admin/dashboard").then((m) => m.AdminAnalytics),
  { loading: () => <DashboardSkeleton />, ssr: false }
);

const SellerDashboard = dynamic(
  () =>
    import("@/modules/seller/dashboard").then((m) => m.SellerDashboard),
  { loading: () => <DashboardSkeleton />, ssr: false }
);

const DashboardOverview = dynamic(
  () =>
    import("@/modules/customer/dashboard").then((m) => m.DashboardOverview),
  { loading: () => <DashboardSkeleton />, ssr: false }
);

export function RoleDashboard({ roles }: { roles: UserRole[] }) {
  if (isSuperAdmin(roles)) return <AdminAnalytics />;
  if (isSeller(roles)) return <SellerDashboard />;
  return <DashboardOverview />;
}
