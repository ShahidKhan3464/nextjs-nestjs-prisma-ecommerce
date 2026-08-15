import type { Metadata } from "next";
import { RoleDashboard } from "./role-dashboard";
import { getAccessTokenPayload } from "@/lib/session-cookie";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getAccessTokenPayload();
  return <RoleDashboard roles={session?.roles ?? []} />;
}
