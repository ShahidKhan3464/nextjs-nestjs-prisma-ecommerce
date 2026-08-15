import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { BuyerDashboardData } from "../types";

export async function fetchBuyerDashboard(): Promise<BuyerDashboardData> {
  const res = await api.get<ApiResponse<BuyerDashboardData>>(
    "/api/v1/customer/dashboard"
  );
  return res.data.data;
}
