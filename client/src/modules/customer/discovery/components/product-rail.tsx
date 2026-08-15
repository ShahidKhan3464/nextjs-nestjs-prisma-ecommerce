"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import type { Product } from "@/modules/buyer/products/types";
import { ProductCard } from "@/modules/buyer/products/components/product-card";

type Props = {
  title: string;
  description?: string;
  products: Product[];
  isPending?: boolean;
  emptyTitle?: string;
  viewAllHref?: string;
  className?: string;
};

export function ProductRail({
  title,
  description,
  products,
  isPending,
  emptyTitle,
  viewAllHref,
  className,
}: Props) {
  if (!isPending && products.length === 0) {
    if (!emptyTitle) return null;
    return (
      <section className={cn("space-y-3", className)}>
        <header className="space-y-0.5">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </header>
        <p className="text-muted-foreground text-sm">{emptyTitle}</p>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all
          </Link>
        ) : null}
      </header>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
