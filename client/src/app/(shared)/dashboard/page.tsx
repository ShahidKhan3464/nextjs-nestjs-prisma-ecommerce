import type { Metadata } from "next";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { RoleDashboard } from "./role-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getAccessTokenPayload();
  return <RoleDashboard roles={session?.roles ?? []} />;
}
