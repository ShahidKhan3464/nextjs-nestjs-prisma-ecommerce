"use client";

import type { KeyboardEvent } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-5.5",
} as const;

type Size = keyof typeof SIZES;

export type RatingStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: Size;
  readOnly?: boolean;
  className?: string;
  ariaLabel?: string;
};

function clampRating(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(5, Math.max(0, value));
}

export function RatingStars({
  value,
  onChange,
  size = "md",
  readOnly = false,
  className,
  ariaLabel = "Rating",
}: RatingStarsProps) {
  const rating = clampRating(value);
  const interactive = !readOnly && typeof onChange === "function";
  const iconClass = SIZES[size];

  const setRating = (next: number) => {
    if (!interactive) return;
    onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setRating(Math.min(5, Math.max(1, Math.round(rating) + 1)));
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setRating(Math.max(1, Math.round(rating) - 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setRating(1);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setRating(5);
      return;
    }

    const digit = Number(event.key);
    if (digit >= 1 && digit <= 5) {
      event.preventDefault();
      setRating(digit);
    }
  };

  return (
    <div
      role={interactive ? "slider" : "img"}
      aria-label={ariaLabel}
      aria-valuemin={interactive ? 1 : undefined}
      aria-valuemax={interactive ? 5 : undefined}
      aria-valuenow={interactive ? Math.round(rating) || 0 : undefined}
      aria-valuetext={`${Math.round(rating)} out of 5`}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-0.5",
        interactive &&
        "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.round(rating);

        if (!interactive) {
          return (
            <Star
              key={starValue}
              aria-hidden
              className={cn(
                iconClass,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          );
        }

        return (
          <button
            type="button"
            tabIndex={-1}
            key={starValue}
            onClick={() => setRating(starValue)}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            className={cn(
              "rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "hover:scale-105 active:scale-95"
            )}
          >
            <Star
              aria-hidden
              className={cn(
                iconClass,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
