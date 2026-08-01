"use client";

import { motion } from "framer-motion";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import type { Product, ProductListParams } from "../types";
import { fetchProducts } from "../services/products.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useWishlistHydrate } from "@/shared/hooks/use-wishlist-hydrate";
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

type Props = {
  /** When set, scopes the listing to a store (also reflected in URL when present). */
  storeId?: number;
};

export function ProductListing({ storeId }: Props) {
  useWishlistHydrate();
  const { values, setParams } = useProductSearchParams();
  const params = toParams({
    ...values,
    storeId: storeId != null ? String(storeId) : values.storeId,
  });

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.products.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => fetchProducts(params),
    placeholderData: (prev) => prev,
  });

  if (isPending && !data) {
    return (
      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 rounded-2xl sm:h-52" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </motion.div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load products"
        description="Please try again in a moment."
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const { data: items, pagination } = data;

  if (items.length === 0) {
    return (
      <EmptyState
        title="No matches"
        description="Adjust filters or search for something else."
      />
    );
  }

  return (
    <div className="space-y-6">
      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>

      <Pagination
        page={pagination.page}
        perPage={pagination.limit}
        onPerPageChange={() => {}}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setParams({ page: p })}
      />
    </div>
  );
}
