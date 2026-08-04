"use client";

import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { ProductRail } from "./product-rail";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { fetchProducts } from "@/modules/customer/products/services/products.service";

type Props = {
  excludeProductId?: string;
  limit?: number;
  sort?: "rating_desc" | "newest";
  className?: string;
};

export function RecommendedProductsRail({
  excludeProductId,
  limit = 8,
  sort = "rating_desc",
  className,
}: Props) {
  const params = {
    page: 1,
    limit: limit + 4,
    sort,
  };

  const { data, isPending } = useQuery({
    queryKey: queryKeys.products.list({
      ...params,
      recommended: true,
      excludeProductId,
    }),
    queryFn: () => fetchProducts(params),
    staleTime: 60_000,
  });

  const products = useMemo(() => {
    const rows = data?.data ?? [];
    return rows
      .filter((p) => !excludeProductId || p.id !== excludeProductId)
      .slice(0, limit);
  }, [data?.data, excludeProductId, limit]);

  return (
    <ProductRail
      products={products}
      isPending={isPending}
      className={className}
      title="Recommended for you"
      description="Top-rated picks from the marketplace."
      viewAllHref={`${ROUTES.products}?sort=rating_desc`}
    />
  );
}
