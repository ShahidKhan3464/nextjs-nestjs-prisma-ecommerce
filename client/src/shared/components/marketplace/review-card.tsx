import Link from "next/link";
import { cn } from "@/lib/utils";
import { RatingStars } from "./rating-stars";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOrderDate } from "@/lib/format-date";

type ReviewCardProps = {
  title: string;
  rating: number;
  comment: string;
  isOwn?: boolean;
  createdAt: string;
  className?: string;
  onEdit?: () => void;
  displayName: string;
  onDelete?: () => void;
  productName?: string | null;
  productHref?: string | null;
};

export function ReviewCard({
  displayName,
  rating,
  title,
  comment,
  createdAt,
  productName,
  productHref,
  isOwn = false,
  onEdit,
  onDelete,
  className,
}: ReviewCardProps) {
  const showActions = isOwn && (onEdit || onDelete);

  return (
    <article
      className={cn(
        "border-border space-y-3 rounded-xl border bg-muted/20 p-4",
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{displayName}</p>
            <RatingStars
              readOnly
              size="sm"
              value={rating}
              ariaLabel={`${displayName} rated ${rating} out of 5`}
            />
          </div>
          {productName ? (
            productHref ? (
              <Link
                href={productHref}
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {productName}
              </Link>
            ) : (
              <p className="text-muted-foreground text-xs">{productName}</p>
            )
          ) : null}
        </div>
        <time
          dateTime={createdAt}
          className="text-muted-foreground shrink-0 text-xs tabular-nums"
        >
          {formatOrderDate(createdAt)}
        </time>
      </header>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {comment}
        </p>
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {onEdit ? (
            <Button
              size="sm"
              type="button"
              onClick={onEdit}
              variant="outline"
              aria-label="Edit review"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              size="sm"
              type="button"
              variant="ghost"
              onClick={onDelete}
              aria-label="Delete review"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
