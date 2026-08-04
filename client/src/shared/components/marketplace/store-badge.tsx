import { cn } from "@/lib/utils";
import { Store } from "lucide-react";
import { RatingStars } from "./rating-stars";
import { VerifiedBadge } from "./verified-badge";

type Props = {
  name: string;
  compact?: boolean;
  verified?: boolean;
  className?: string;
  rating?: number | null;
};

export function StoreBadge({
  name,
  verified = false,
  rating,
  className,
  compact = false,
}: Props) {
  const showRating =
    typeof rating === "number" && !Number.isNaN(rating) && rating > 0;

  return (
    <div
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5",
        className
      )}
    >
      <Store
        aria-hidden
        className={cn(
          "text-muted-foreground shrink-0",
          compact ? "size-3" : "size-3.5"
        )}
      />
      <span
        className={cn(
          "min-w-0 truncate font-medium",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {name}
      </span>
      {verified ? <VerifiedBadge compact /> : null}
      {showRating ? (
        <span className="inline-flex items-center gap-1">
          <RatingStars
            readOnly
            value={rating}
            size="sm"
            ariaLabel={`${name} rating ${rating.toFixed(1)} out of 5`}
          />
          <span className="text-muted-foreground text-xs tabular-nums">
            {rating.toFixed(1)}
          </span>
        </span>
      ) : null}
    </div>
  );
}
