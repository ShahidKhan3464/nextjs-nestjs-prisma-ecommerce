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
    page: values.page,
    limit: 12,
  };
}

export function ProductListing() {
  useWishlistHydrate();
  const { values, setParams } = useProductSearchParams();
  const params = toParams(values);

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
          <Skeleton key={i} className="h-48 rounded-2xl sm:h-52" />
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
        onPerPageChange={() => {}} // Not implemented in search params yet, but required by component
        totalPages={pagination.totalPages}
        onPageChange={(p) => setParams({ page: p })}
      />
    </div>
  );
}
