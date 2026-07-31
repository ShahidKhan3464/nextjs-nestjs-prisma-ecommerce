import type { Metadata } from "next";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";
import { AdminAnalytics } from "@/modules/admin/dashboard";
import { SellerDashboard } from "@/modules/seller/dashboard";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { DashboardOverview } from "@/modules/customer/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) return <AdminAnalytics />;
  if (session && isSeller(session.roles)) return <SellerDashboard />;

  return <DashboardOverview />;
}
