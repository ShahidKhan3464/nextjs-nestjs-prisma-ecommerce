"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { ProductFilters } from "./product-filters";
import { ProductListing } from "./product-listing";
import { fetchProducts } from "../services/products.service";
import { toProductListParams } from "../utils/product-list-params";
import { ProductFiltersSkeleton } from "./product-filters-skeleton";
import { useProductSearchParams } from "../hooks/use-product-search-params";

export function ProductsPageContent() {
  const { values } = useProductSearchParams();
  const params = toProductListParams(values);

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
    values.sort.length > 0 ||
    values.storeId.length > 0 ||
    values.sellerId.length > 0;
  const filtersDisabled =
    (data?.pagination.total ?? 0) === 0 && !hasActiveFilters;

  return (
    <div className="space-y-4">
      {showInitialSkeleton ? (
        <ProductFiltersSkeleton />
      ) : (
        <ProductFilters disabled={filtersDisabled} />
      )}
      <ProductListing
        listData={data}
        listParams={params}
        listPending={isPending}
      />
    </div>
  );
}
