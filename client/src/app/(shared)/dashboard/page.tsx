import type { Metadata } from "next";
import { isSuperAdmin } from "@/modules/auth/utils/roles";
import { AdminAnalytics } from "@/modules/admin/dashboard";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { DashboardOverview } from "@/modules/customer/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) return <AdminAnalytics />;

  return <DashboardOverview />;
}
