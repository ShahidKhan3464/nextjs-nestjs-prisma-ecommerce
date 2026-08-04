"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import type { WishlistAvailability } from "../types";
import { wishlistToggle } from "@/lib/wishlist-actions";
import { useWishlistStore } from "@/store/wishlist-store";
import { fetchWishlist } from "../services/wishlist.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useWishlistHydrate } from "@/shared/hooks/use-wishlist-hydrate";
import { VerifiedBadge } from "@/modules/customer/products/components/verified-badge";

function availabilityLabel(value: WishlistAvailability) {
  switch (value) {
    case "out_of_stock":
      return "Out of stock";
    case "low_stock":
      return "Low stock";
    default:
      return "In stock";
  }
}

function availabilityVariant(
  value: WishlistAvailability
): "destructive" | "secondary" | "outline" {
  if (value === "out_of_stock") return "destructive";
  if (value === "low_stock") return "secondary";
  return "outline";
}

export function WishlistGrid() {
  useWishlistHydrate();
  const ids = useWishlistStore((s) => s.productIds);

  const { data, isPending } = useQuery({
    queryKey: [...queryKeys.wishlist.all, ids.join(",")],
    queryFn: fetchWishlist,
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
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = data.items.filter((item) => ids.includes(item.id));

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
      {items.map((item) => (
        <article
          key={item.id}
          className="bg-card border-border flex flex-col overflow-hidden rounded-2xl border shadow-sm"
        >
          <Link
            href={ROUTES.product(item.slug)}
            className="relative block h-48 w-full overflow-hidden border-b bg-muted/40"
          >
            <Image
              fill
              alt={item.name}
              src={item.image ?? "/placeholder.svg"}
              className="object-cover"
              sizes="(max-width:640px) 100vw, 25vw"
            />
            <div className="absolute top-3 left-3 z-10">
              <Badge variant={availabilityVariant(item.availability)}>
                {availabilityLabel(item.availability)}
              </Badge>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <Button
                size="icon"
                type="button"
                variant="secondary"
                aria-label="Remove from wishlist"
                className="size-9 rounded-full bg-white/90 text-primary shadow-md"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void wishlistToggle(item.id);
                }}
              >
                <Heart className="size-4 fill-current" />
              </Button>
            </div>
          </Link>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <Link
              href={ROUTES.product(item.slug)}
              className="line-clamp-1 font-semibold tracking-tight hover:text-primary"
            >
              {item.name}
            </Link>
            {item.store ? (
              <div className="space-y-1">
                <div className="flex min-w-0 items-center gap-1.5 text-xs">
                  <Link
                    href={ROUTES.publicStore(item.store.slug)}
                    className="truncate font-medium hover:text-primary"
                  >
                    {item.store.name}
                  </Link>
                  {item.store.verified ? <VerifiedBadge compact /> : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {item.store.sellerName}
                </p>
              </div>
            ) : null}
            <p className="mt-auto text-lg font-bold tabular-nums">
              ${item.basePrice.toFixed(2)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
