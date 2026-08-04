"use client";

import { useMemo } from "react";
import { ProductRail } from "./product-rail";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { fetchProducts } from "@/modules/customer/products/services/products.service";

type Props = {
  limit?: number;
  className?: string;
  categoryId?: number;
  categoryName?: string;
  excludeProductId?: string;
};

export function RelatedProductsRail({
  categoryId,
  categoryName,
  excludeProductId,
  limit = 8,
  className,
}: Props) {
  const params = {
    categoryId,
    page: 1,
    limit: limit + 4,
    sort: "newest" as const,
  };

  const { data, isPending } = useQuery({
    queryKey: queryKeys.products.list({
      ...params,
      related: true,
      excludeProductId,
    }),
    queryFn: () => fetchProducts(params),
    enabled: categoryId != null && categoryId > 0,
    staleTime: 60_000,
  });

  const products = useMemo(() => {
    const rows = data?.data ?? [];
    return rows
      .filter((p) => !excludeProductId || p.id !== excludeProductId)
      .slice(0, limit);
  }, [data?.data, excludeProductId, limit]);

  if (categoryId == null || categoryId <= 0) return null;

  return (
    <ProductRail
      products={products}
      isPending={isPending}
      className={className}
      title="Related products"
      description={
        categoryName
          ? `More from ${categoryName}.`
          : "Similar items you might like."
      }
    />
  );
}
