"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { fetchSellerReviews } from "../services/reviews.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { RatingStars } from "@/shared/components/marketplace/rating-stars";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";

export function SellerReviewsList() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const listParams = useMemo(
    () => ({ page, limit: perPage }),
    [page, perPage]
  );

  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } =
    useQuery({
      queryKey: queryKeys.reviews.seller(listParams),
      queryFn: () => fetchSellerReviews(listParams),
      placeholderData: (prev) => prev,
    });

  if (isPending && !data) {
    return (
      <AdminTableSkeleton
        withToolbar={false}
        columns={[
          { className: "flex-1" },
          { className: "w-28" },
          { className: "w-24" },
          { className: "flex-1 max-w-[28%]" },
          { className: "w-28" },
        ]}
      />
    );
  }

  if (isError && !data) {
    return (
      <EmptyState
        title="Could not load reviews"
        description="Something went wrong loading store reviews."
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) return null;

  const reviews = data.reviews ?? [];
  const total = data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="When buyers leave ratings on your products, they will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={
          isFetching && !isPlaceholderData
            ? "opacity-60 transition-opacity"
            : ""
        }
      >
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Date</TableHead>
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
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{review.buyer.displayName}</TableCell>
                  <TableCell>
                    <RatingStars readOnly value={review.rating} size="sm" />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {review.title ? (
                      <p className="truncate text-sm font-medium">
                        {review.title}
                      </p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
