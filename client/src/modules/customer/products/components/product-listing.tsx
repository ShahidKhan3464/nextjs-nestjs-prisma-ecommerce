"use client";

import { motion } from "framer-motion";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginatedResponse } from "@/types/api";
import { Pagination } from "@/components/ui/pagination";
import type { Product, ProductListParams } from "../types";
import { fetchProducts } from "../services/products.service";
import { toProductListParams } from "../utils/product-list-params";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useWishlistHydrate } from "@/shared/hooks/use-wishlist-hydrate";
import { useProductSearchParams } from "../hooks/use-product-search-params";

type Props = {
  /** When set, scopes the listing to a store (also reflected in URL when present). */
  storeId?: number;
  /** When provided by a parent, avoids a duplicate products query. */
  listData?: PaginatedResponse<Product> | undefined;
  listPending?: boolean;
  listParams?: ProductListParams;
};

export function ProductListing({
  storeId,
  listData,
  listPending,
  listParams,
}: Props) {
  useWishlistHydrate();
  const { values, setParams } = useProductSearchParams();
  const params =
    listParams ??
    toProductListParams(
      {
        ...values,
        storeId: storeId != null ? String(storeId) : values.storeId,
      },
      storeId != null ? { storeId } : undefined
    );

  const ownedQuery = useQuery({
    queryKey: queryKeys.products.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => fetchProducts(params),
    placeholderData: (prev) => prev,
    enabled: listData === undefined && listPending === undefined,
  });

  const data = listData !== undefined ? listData : ownedQuery.data;
  const isPending =
    listPending !== undefined ? listPending : ownedQuery.isPending;
  const isError = listData !== undefined ? false : ownedQuery.isError;
  const refetch = ownedQuery.refetch;

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
        perPage={values.limit}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setParams({ page: p })}
        onPerPageChange={(n) => setParams({ limit: n, page: 1 })}
      />
    </div>
  );
}
