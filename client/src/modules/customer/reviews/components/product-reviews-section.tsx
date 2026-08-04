"use client";

import { toast } from "sonner";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOrderDate } from "@/lib/format-date";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBuyer } from "@/modules/auth/utils/roles";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pagination } from "@/components/ui/pagination";
import { useForm, type Resolver } from "react-hook-form";
import { RatingDistribution } from "./rating-distribution";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ReviewCard } from "@/shared/components/marketplace/review-card";
import { RatingStars } from "@/shared/components/marketplace/rating-stars";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReviewSchema,
  type ReviewFormValues,
} from "../schemas/review.schema";
import {
  createReview,
  deleteReview,
  fetchMyReviews,
  fetchProductReviews,
  fetchProductSummary,
  updateReview,
} from "../services/reviews.service";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

type Props = {
  productId: string;
  averageRating?: number;
  reviewCount?: number;
};

const emptyForm: ReviewFormValues = {
  rating: 5,
  title: "",
  comment: "",
};

function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

export function ProductReviewsSection({
  productId,
  averageRating,
  reviewCount,
}: Props) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const authenticated = Boolean(user);
  const canReview = authenticated && isBuyer(user?.roles ?? []);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const listParams = React.useMemo(
    () => ({ page, limit: perPage }),
    [page, perPage]
  );

  const summaryQuery = useQuery({
    queryKey: queryKeys.reviews.summary(productId),
    queryFn: () => fetchProductSummary(productId),
    staleTime: 60_000,
  });

  const listQuery = useQuery({
    queryKey: queryKeys.reviews.product(productId, listParams),
    queryFn: () => fetchProductReviews(productId, listParams),
    staleTime: 30_000,
  });

  const myReviewsQuery = useQuery({
    queryKey: queryKeys.reviews.mine,
    queryFn: () => fetchMyReviews({ limit: 100 }),
    enabled: canReview,
    staleTime: 30_000,
  });

  const myReview = React.useMemo(
    () =>
      myReviewsQuery.data?.reviews.find((r) => r.productId === productId) ??
      null,
    [myReviewsQuery.data, productId]
  );

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(createReviewSchema) as Resolver<ReviewFormValues>,
    defaultValues: emptyForm,
  });

  React.useEffect(() => {
    if (myReview) {
      form.reset({
        rating: myReview.rating,
        title: myReview.title ?? "",
        comment: myReview.comment ?? "",
      });
      setEditingId(myReview.id);
      setShowForm(false);
    } else {
      form.reset(emptyForm);
      setEditingId(null);
    }
  }, [myReview, form]);

  const invalidate = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
    void qc.invalidateQueries({ queryKey: queryKeys.reviews.mine });
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      createReview({
        productId,
        rating: values.rating,
        title: values.title,
        comment: values.comment,
      }),
    onSuccess: () => {
      setFormError(null);
      setShowForm(false);
      toast.success("Review submitted");
      invalidate();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setFormError(message);
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: ReviewFormValues) => {
      if (!editingId) throw new Error("No review to update");
      return updateReview(editingId, {
        rating: values.rating,
        title: values.title?.trim() ? values.title.trim() : null,
        comment: values.comment?.trim() ? values.comment.trim() : null,
      });
    },
    onSuccess: () => {
      setFormError(null);
      setShowForm(false);
      toast.success("Review updated");
      invalidate();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      toast.success("Review deleted");
      setShowForm(false);
      form.reset(emptyForm);
      setEditingId(null);
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const summary = summaryQuery.data;
  const reviews = listQuery.data?.reviews ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const avg = summary?.averageRating ?? averageRating ?? 0;
  const reviewTotal = summary?.totalReviews ?? reviewCount ?? 0;

  function onSubmit(values: ReviewFormValues) {
    setFormError(null);
    if (editingId) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <section
      aria-labelledby="product-reviews-heading"
      className="mx-auto max-w-6xl space-y-6 px-4 pb-10 lg:px-6"
    >
      <header className="space-y-1">
        <h2
          id="product-reviews-heading"
          className="font-heading text-2xl font-semibold tracking-tight"
        >
          Reviews
        </h2>
        <p className="text-muted-foreground text-sm">
          Ratings from verified purchases of this product.
        </p>
      </header>

      {summaryQuery.isPending ? (
        <ReviewsSkeleton />
      ) : (
        <div className="border-border grid gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
          <div className="flex flex-col items-start gap-2 sm:items-center sm:justify-center sm:px-4">
            <p className="text-4xl font-semibold tabular-nums tracking-tight">
              {avg.toFixed(1)}
            </p>
            <RatingStars value={avg} readOnly size="lg" />
            <p className="text-muted-foreground text-xs">
              {reviewTotal} review{reviewTotal === 1 ? "" : "s"}
            </p>
          </div>
          {summary ? (
            <RatingDistribution
              distribution={summary.distribution}
              totalReviews={summary.totalReviews}
            />
          ) : null}
        </div>
      )}

      {canReview ? (
        <div className="border-border space-y-3 rounded-2xl border bg-muted/20 p-5">
          {myReview && !showForm ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">
                You reviewed this product on{" "}
                <span className="font-medium">
                  {formatOrderDate(myReview.createdAt)}
                </span>
                .
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowForm(true);
                    setFormError(null);
                  }}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(myReview.id)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!myReview && !showForm ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    Bought this product? Share your experience.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setShowForm(true);
                      setFormError(null);
                    }}
                  >
                    Write a review
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <FormControl>
                            <RatingStars
                              size="lg"
                              value={field.value}
                              onChange={field.onChange}
                              ariaLabel="Your rating"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Sum up your experience"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="What did you like or dislike?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {formError ? (
                      <p className="text-destructive text-sm" role="alert">
                        {formError}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving
                          ? "Saving…"
                          : editingId
                            ? "Update review"
                            : "Submit review"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowForm(false);
                          setFormError(null);
                          if (myReview) {
                            form.reset({
                              rating: myReview.rating,
                              title: myReview.title ?? "",
                              comment: myReview.comment ?? "",
                            });
                          } else {
                            form.reset(emptyForm);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </>
          )}
        </div>
      ) : null}

      {listQuery.isPending ? (
        <ReviewsSkeleton />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Be the first to share feedback after your order is delivered."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard
                rating={review.rating}
                createdAt={review.createdAt}
                comment={review.comment ?? ""}
                title={review.title ?? "Review"}
                displayName={review.buyer.displayName}
              />
            </li>
          ))}
        </ul>
      )}

      {total > perPage || page > 1 ? (
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
      ) : null}
    </section>
  );
}
