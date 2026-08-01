import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";

export type CustomerCategoryOption = {
  id: number;
  name: string;
  description: string | null;
};

export async function fetchCustomerCategories(): Promise<
  CustomerCategoryOption[]
> {
  const res = await api.get<
    ApiResponse<{ categories: CustomerCategoryOption[] }>
  >("/api/v1/customer/categories");
  return res.data.data.categories;
}
