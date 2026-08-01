import { api } from "@/services/api/client";
import type { SellerCategoryOption } from "../types";

export async function fetchSellerCategories(params?: {
  limit?: number;
  search?: string;
}): Promise<SellerCategoryOption[]> {
  const res = await api.get<{ data: { categories: SellerCategoryOption[] } }>(
    "/api/v1/seller/categories",
    { params }
  );
  return res.data.data.categories;
}
