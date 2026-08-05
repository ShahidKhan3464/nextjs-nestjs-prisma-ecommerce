import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { CustomerCategoryOption } from "../types";

export async function fetchCustomerCategories(): Promise<
  CustomerCategoryOption[]
> {
  const res = await api.get<
    ApiResponse<{ categories: CustomerCategoryOption[] }>
  >("/api/v1/customer/categories");
  return res.data.data.categories;
}
