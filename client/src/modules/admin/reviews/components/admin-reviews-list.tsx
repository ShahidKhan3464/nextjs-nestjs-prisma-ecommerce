"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";
import type { Review } from "@/modules/customer/reviews/types";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { RatingStars } from "@/shared/components/marketplace/rating-stars";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminReview,
  fetchAdminReviews,
} from "../services/reviews.service";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

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
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [storeIdInput, setStoreIdInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  useEffect(() => {
    setPage(1);
  }, [ratingFilter, storeIdInput]);

  const listParams = useMemo(
    () => ({
      page,
      limit: perPage,
      rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
      storeId: storeIdInput.trim() || undefined,
    }),
    [page, perPage, ratingFilter, storeIdInput]
  );

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.reviews.admin(listParams),
    queryFn: () => fetchAdminReviews(listParams),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteAdminReview(id),
    onSuccess: async () => {
      toast.success("Review removed");
      setDeleteTarget(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
        qc.invalidateQueries({ queryKey: queryKeys.stores.all }),
        qc.invalidateQueries({ queryKey: queryKeys.products.all }),
        qc.invalidateQueries({ queryKey: queryKeys.admin.analytics }),
        qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
      ]);
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
  const hasFilters = ratingFilter !== "all" || storeIdInput.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-36">
          <Input
            value={storeIdInput}
            placeholder="Store id"
            onChange={(e) => setStoreIdInput(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            value={ratingFilter}
            onValueChange={(value) => setRatingFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full!">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((rating) => (
                <SelectItem key={rating} value={String(rating)}>
                  {rating} stars
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching reviews" : "No reviews"}
          description={
            hasFilters
              ? "Try adjusting the rating or store filters."
              : "There are no product reviews to moderate yet."
          }
        />
      ) : (
        <>
          <div className="border-border overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Store</TableHead>
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
                    <TableCell className="font-mono text-xs">
                      {review.product?.storeId ? (
                        <Link
                          href={ROUTES.adminStore(review.product.storeId)}
                          className="hover:underline"
                        >
                          #{review.product.storeId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={ROUTES.user(review.buyer.id)}
                        className="hover:underline"
                      >
                        {review.buyer.displayName}
                      </Link>
                    </TableCell>
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
                    <TableCell>
                      <Button
                        size="icon"
                        type="button"
                        variant="ghost"
                        aria-label="Delete review"
                        disabled={removeMutation.isPending}
                        onClick={() => setDeleteTarget(review)}
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
        </>
      )}

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Permanently remove the review by ${deleteTarget.buyer.displayName}. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={removeMutation.isPending || !deleteTarget}
              onClick={() => {
                if (deleteTarget) removeMutation.mutate(deleteTarget.id);
              }}
            >
              {removeMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
