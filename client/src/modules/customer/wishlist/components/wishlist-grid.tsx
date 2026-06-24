"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist-store";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useWishlistHydrate } from "@/shared/hooks/use-wishlist-hydrate";
import { ProductCard } from "@/modules/customer/products/components/product-card";
import { fetchProducts } from "@/modules/customer/products/services/products.service";

export function WishlistGrid() {
  useWishlistHydrate();
  const ids = useWishlistStore((s) => s.productIds);

  const { data, isPending } = useQuery({
    queryKey: [
      ...queryKeys.wishlist.all,
      ...queryKeys.products.all,
      ids.join(","),
    ],
    queryFn: () => fetchProducts({ limit: 100, page: 1 }),
    enabled: ids.length > 0,
  });

  if (ids.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Tap the heart on a product to save it here."
        action={
          <Link href={ROUTES.products} className={cn(buttonVariants())}>
            Browse products
          </Link>
        }
      />
    );
  }

  if (isPending || !data) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl sm:h-52" />
        ))}
      </div>
    );
  }

  const items = data.data.filter((p) => ids.includes(p.id));

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to show"
        description="Saved products may no longer be available."
        action={
          <Link href={ROUTES.products} className={cn(buttonVariants())}>
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
