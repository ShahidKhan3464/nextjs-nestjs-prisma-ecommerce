import type { ProductListParams } from "../types";
import type { useProductSearchParams } from "../hooks/use-product-search-params";

export const PRODUCT_LIST_PAGE_SIZE = 12;

export function toProductListParams(
  values: ReturnType<typeof useProductSearchParams>["values"],
  overrides?: Partial<{ storeId: number }>
): ProductListParams {
  const storeId =
    overrides?.storeId != null
      ? overrides.storeId
      : values.storeId
        ? Number(values.storeId)
        : undefined;

  return {
    q: values.q || undefined,
    categoryId: values.category ? Number(values.category) : undefined,
    minPrice: values.minPrice ? Number(values.minPrice) : undefined,
    maxPrice: values.maxPrice ? Number(values.maxPrice) : undefined,
    minRating: values.minRating ? Number(values.minRating) : undefined,
    inStock: values.inStock === "true" ? true : undefined,
    storeId,
    sellerId: values.sellerId ? Number(values.sellerId) : undefined,
    sort: values.sort || undefined,
    page: values.page,
    limit: PRODUCT_LIST_PAGE_SIZE,
  };
}
