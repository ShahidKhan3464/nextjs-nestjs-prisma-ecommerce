import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { BuyerCategoryOption } from "../types";

export async function fetchBuyerCategories(): Promise<BuyerCategoryOption[]> {
  const res = await api.get<ApiResponse<{ categories: BuyerCategoryOption[] }>>(
    "/api/v1/customer/categories"
  );
  return res.data.data.categories;
}
