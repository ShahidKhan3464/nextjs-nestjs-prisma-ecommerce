"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { StoreLike } from "./types";
import { ROUTES } from "@/constants/routes";
import { VerifiedBadge } from "@/shared/components/marketplace";

type Props = {
  store: StoreLike | null;
  className?: string;
  compact?: boolean;
  trailing?: React.ReactNode;
};

export function StoreGroupHeader({
  store,
  className,
  compact = false,
  trailing,
}: Props) {
  if (!store) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          className
        )}
      >
        <p className="text-sm font-medium">Marketplace sellers</p>
        {trailing}
      </div>
    );
  }

  const initial = store.name.charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={ROUTES.publicStore(store.slug)}
          className="flex min-w-0 items-center gap-3 rounded-md transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={cn(
              "relative shrink-0 overflow-hidden rounded-md border bg-muted",
              compact ? "size-8" : "size-10"
            )}
          >
            {store.logoUrl ? (
              <Image
                fill
                alt=""
                src={store.logoUrl}
                className="object-cover"
                sizes={compact ? "32px" : "40px"}
              />
            ) : (
              <span
                className={cn(
                  "text-muted-foreground flex size-full items-center justify-center font-semibold",
                  compact ? "text-xs" : "text-sm"
                )}
              >
                {initial}
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "flex items-center gap-2 font-medium",
                compact ? "text-sm" : "text-base"
              )}
            >
              <span className="truncate">{store.name}</span>
              {store.verified ? <VerifiedBadge compact /> : null}
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              Sold by {store.sellerName}
            </span>
          </span>
        </Link>
      </div>
      {trailing}
    </div>
  );
}
