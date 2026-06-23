import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { AdminAnalyticsData } from "../types";

export async function fetchAdminAnalytics(): Promise<AdminAnalyticsData> {
  const res = await api.get<ApiResponse<AdminAnalyticsData>>(
    "/api/v1/admin/analytics"
  );
  return res.data.data;
}
