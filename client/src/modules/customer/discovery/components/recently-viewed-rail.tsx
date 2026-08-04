"use client";

import { useMemo } from "react";
import { ProductRail } from "./product-rail";
import { useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import type { Product } from "@/modules/customer/products/types";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import { fetchProductBySlug } from "@/modules/customer/products/services/products.service";

type Props = {
  excludeProductId?: string;
  limit?: number;
  className?: string;
};

export function RecentlyViewedRail({
  excludeProductId,
  limit = 8,
  className,
}: Props) {
  const slugs = useRecentlyViewedStore((s) => s.slugs);
  const targetSlugs = useMemo(
    () => slugs.slice(0, limit + (excludeProductId ? 1 : 0)),
    [slugs, limit, excludeProductId]
  );

  const results = useQueries({
    queries: targetSlugs.map((slug) => ({
      queryKey: queryKeys.products.bySlug(slug),
      queryFn: () => fetchProductBySlug(slug),
      staleTime: 60_000,
      retry: false,
    })),
  });

  const isPending =
    targetSlugs.length > 0 && results.some((r) => r.isPending);

  const products = useMemo(() => {
    const list: Product[] = [];
    for (const result of results) {
      if (!result.data) continue;
      if (excludeProductId && result.data.id === excludeProductId) continue;
      list.push(result.data);
      if (list.length >= limit) break;
    }
    return list;
  }, [results, excludeProductId, limit]);

  if (targetSlugs.length === 0) return null;

  return (
    <ProductRail
      products={products}
      isPending={isPending}
      className={className}
      title="Recently viewed"
      description="Pick up where you left off."
    />
  );
}
