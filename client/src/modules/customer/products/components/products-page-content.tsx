"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductListParams } from "../types";
import { queryKeys } from "@/constants/query-keys";
import { ProductFilters } from "./product-filters";
import { ProductListing } from "./product-listing";
import { fetchProducts } from "../services/products.service";
import { ProductFiltersSkeleton } from "./product-filters-skeleton";
import { useProductSearchParams } from "../hooks/use-product-search-params";
import {
  RecentlyViewedRail,
  RecommendedProductsRail,
} from "@/modules/customer/discovery";

function toParams(
  values: ReturnType<typeof useProductSearchParams>["values"]
): ProductListParams {
  return {
    q: values.q || undefined,
    categoryId: values.category ? Number(values.category) : undefined,
    minPrice: values.minPrice ? Number(values.minPrice) : undefined,
    maxPrice: values.maxPrice ? Number(values.maxPrice) : undefined,
    minRating: values.minRating ? Number(values.minRating) : undefined,
    inStock: values.inStock === "true" ? true : undefined,
    storeId: values.storeId ? Number(values.storeId) : undefined,
    sellerId: values.sellerId ? Number(values.sellerId) : undefined,
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
    values.minRating.length > 0 ||
    values.inStock.length > 0 ||
    values.sort.length > 0 ||
    values.storeId.length > 0 ||
    values.sellerId.length > 0;
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
      <div className="space-y-10 pt-6">
        <RecentlyViewedRail />
        <RecommendedProductsRail />
      </div>
    </div>
  );
}
