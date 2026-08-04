"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";
import { fetchAdminReviews } from "../services/reviews.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { RatingStars } from "@/shared/components/marketplace/rating-stars";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteReview } from "@/modules/customer/reviews/services/reviews.service";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";

function AdminReviewsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function AdminReviewsList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const listParams = useMemo(
    () => ({ page, limit: perPage }),
    [page, perPage]
  );

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.reviews.admin(listParams),
    queryFn: () => fetchAdminReviews(listParams),
  });

  const removeMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      toast.success("Review removed");
      void qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (isPending) return <AdminReviewsSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title="Could not load reviews"
        description="Something went wrong loading marketplace reviews."
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews"
        description="There are no product reviews to moderate yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  {review.product ? (
                    <Link
                      href={ROUTES.product(review.product.slug)}
                      className="font-medium hover:underline"
                    >
                      {review.product.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      #{review.productId}
                    </span>
                  )}
                </TableCell>
                <TableCell>{review.buyer.displayName}</TableCell>
                <TableCell>
                  <RatingStars readOnly value={review.rating} size="sm" />
                </TableCell>
                <TableCell className="max-w-xs">
                  {review.title ? (
                    <p className="truncate text-sm font-medium">{review.title}</p>
                  ) : null}
                  {review.comment ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {review.comment}
                    </p>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatOrderDate(review.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Delete review"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(review.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />
    </div>
  );
}
