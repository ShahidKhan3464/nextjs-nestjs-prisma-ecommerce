import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { CustomerDashboardData } from "../types";

export async function fetchCustomerDashboard(): Promise<CustomerDashboardData> {
  const res = await api.get<ApiResponse<CustomerDashboardData>>(
    "/api/v1/customer/dashboard"
  );
  return res.data.data;
}
