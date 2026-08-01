"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductListParams } from "../types";
import { queryKeys } from "@/constants/query-keys";
import { ProductFilters } from "./product-filters";
import { ProductListing } from "./product-listing";
import { fetchProducts } from "../services/products.service";
import { ProductFiltersSkeleton } from "./product-filters-skeleton";
import { useProductSearchParams } from "../hooks/use-product-search-params";

function toParams(
  values: ReturnType<typeof useProductSearchParams>["values"]
): ProductListParams {
  return {
    q: values.q || undefined,
    categoryId: values.category ? Number(values.category) : undefined,
    maxPrice: values.maxPrice ? Number(values.maxPrice) : undefined,
    storeId: values.storeId ? Number(values.storeId) : undefined,
    sort: values.sort || undefined,
    page: values.page,
    limit: 12,
  };
}

export function ProductsPageContent() {
  const { values } = useProductSearchParams();
  const params = toParams(values);

  const { isPending, data } = useQuery({
    queryKey: queryKeys.products.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => fetchProducts(params),
    placeholderData: (prev) => prev,
  });

  const showInitialSkeleton = isPending && !data;
  const hasActiveFilters =
    values.q.trim().length > 0 ||
    values.category.length > 0 ||
    values.maxPrice.length > 0 ||
    values.minPrice.length > 0 ||
    values.sort.length > 0 ||
    values.storeId.length > 0;
  const filtersDisabled =
    (data?.pagination.total ?? 0) === 0 && !hasActiveFilters;

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Products
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse our catalog and find the perfect product for you.
        </p>
      </header>
      {showInitialSkeleton ? (
        <ProductFiltersSkeleton />
      ) : (
        <ProductFilters disabled={filtersDisabled} />
      )}
      <ProductListing />
    </div>
  );
}
