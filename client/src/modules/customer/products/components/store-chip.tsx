"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import type { ProductStore } from "../types";
import { VerifiedBadge } from "./verified-badge";

type Props = {
  compact?: boolean;
  className?: string;
  store: ProductStore;
  showVerified?: boolean;
};

export function StoreChip({
  store,
  className,
  showVerified = true,
  compact = false,
}: Props) {
  const href = ROUTES.publicStore(store.slug);
  const initial = store.name.charAt(0).toUpperCase() || "?";

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Link
        href={href}
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-md transition-colors hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-md border bg-muted",
            compact ? "size-6" : "size-8"
          )}
        >
          {store.logoUrl ? (
            <Image
              fill
              alt=""
              src={store.logoUrl}
              className="object-cover"
              sizes={compact ? "24px" : "32px"}
            />
          ) : (
            <span
              className={cn(
                "text-muted-foreground flex size-full items-center justify-center font-semibold",
                compact ? "text-[10px]" : "text-xs"
              )}
            >
              {initial}
            </span>
          )}
        </span>
        <span className={cn("min-w-0 truncate font-medium", compact ? "text-xs" : "text-sm")}>
          {store.name}
        </span>
      </Link>
      {showVerified && store.verified ? (
        <VerifiedBadge compact={compact} />
      ) : null}
    </div>
  );
}
