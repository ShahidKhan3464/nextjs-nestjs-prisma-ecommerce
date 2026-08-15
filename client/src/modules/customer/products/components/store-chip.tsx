"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductStore } from "../types";
import { VerifiedBadge } from "@/shared/components/marketplace";

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
  const initial = store.name.charAt(0).toUpperCase() || "?";

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div className="flex min-w-0 items-center gap-2">
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
        <span
          className={cn(
            "min-w-0 truncate font-medium",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {store.name}
        </span>
      </div>
      {showVerified && store.verified ? (
        <VerifiedBadge compact={compact} />
      ) : null}
    </div>
  );
}
