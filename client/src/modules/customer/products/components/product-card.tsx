"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "../types";
import { StoreChip } from "./store-chip";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { ProductBadges } from "./product-badges";
import { wishlistToggle } from "@/lib/wishlist-actions";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatFilterLabel } from "@/lib/format-filter-label";
import { RatingStars } from "@/shared/components/marketplace/rating-stars";

type Props = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: Props) {
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const prices = product.variants.map((v) => v.price);
  const minPrice =
    prices.length > 0 ? Math.min(...prices) : product.basePrice;

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "bg-card border-border group relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-lg",
        className
      )}
    >
      <Link
        href={ROUTES.product(product.slug)}
        aria-label={`View ${product.name}`}
        className="border-border relative block h-48 w-full shrink-0 overflow-hidden border-b bg-muted/40 sm:h-52"
      >
        <Image
          fill
          priority={false}
          alt={product.name}
          src={product.images[0] ?? "/placeholder.svg"}
          sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-3.5rem)]">
          <ProductBadges product={product} />
        </div>
        <div className="absolute top-3 right-3 z-10">
          <Button
            size="icon"
            type="button"
            variant="secondary"
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "size-9 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 dark:bg-black/60",
              wishlisted && "text-primary"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void wishlistToggle(product.id);
            }}
          >
            <Heart className={cn("size-4", wishlisted && "fill-current")} />
          </Button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <Link
            href={ROUTES.product(product.slug)}
            className="line-clamp-1 text-base font-semibold tracking-tight transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
          <p className="text-muted-foreground text-xs">
            {formatFilterLabel(product.category)}
          </p>
          {product.averageRating != null && product.averageRating > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <RatingStars
                readOnly
                size="sm"
                value={product.averageRating}
                ariaLabel={`Rated ${product.averageRating.toFixed(1)} out of 5`}
              />
              <span className="text-muted-foreground text-xs tabular-nums">
                {product.averageRating.toFixed(1)}
                {product.reviewCount != null
                  ? ` (${product.reviewCount})`
                  : ""}
              </span>
            </span>
          ) : null}
          {product.store ? (
            <StoreChip store={product.store} compact showVerified />
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
              From
            </p>
            <p className="text-lg font-bold tabular-nums">
              $
              {minPrice.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <Link href={ROUTES.product(product.slug)} className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 text-xs font-semibold"
            >
              Details
            </Button>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
