import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { SellerDashboardData } from "../types";

export async function fetchSellerDashboard(): Promise<SellerDashboardData> {
  const res = await api.get<ApiResponse<SellerDashboardData>>(
    "/api/v1/seller/dashboard"
  );
  return res.data.data;
}
