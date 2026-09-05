"use client";

import { cn } from "@/lib/utils";
import type { RatingDistribution as Distribution } from "../types";

type Props = {
  distribution: Distribution;
  totalReviews: number;
  className?: string;
};

export function RatingDistribution({
  distribution,
  totalReviews,
  className,
}: Props) {
  const levels = [5, 4, 3, 2, 1] as const;

  return (
    <div className={cn("space-y-1.5", className)}>
      {levels.map((level) => {
        const count = distribution[level] ?? 0;
        const pct =
          totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
        return (
          <div key={level} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-8 tabular-nums">
              {level}★
            </span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-amber-500 transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-muted-foreground w-8 text-right tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
