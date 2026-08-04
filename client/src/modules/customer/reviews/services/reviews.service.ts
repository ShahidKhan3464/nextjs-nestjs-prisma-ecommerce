import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";
import type {
  CreateReviewInput,
  Review,
  ReviewListParams,
  ReviewListResult,
  ReviewSummary,
  StoreReputation,
  UpdateReviewInput,
} from "../types";

function toSearchParams(params: ReviewListParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.rating) search.set("rating", String(params.rating));
  return search;
}

export async function fetchProductReviews(
  productId: string,
  params: ReviewListParams = {}
): Promise<ReviewListResult> {
  const search = toSearchParams(params);
  const qs = search.toString();
  const res = await api.get<ApiResponse<ReviewListResult>>(
    `/api/v1/customer/reviews/product/${encodeURIComponent(productId)}${qs ? `?${qs}` : ""}`
  );
  return res.data.data;
}

export async function fetchProductSummary(productId: string) {
  const res = await api.get<ApiResponse<{ summary: ReviewSummary }>>(
    `/api/v1/customer/reviews/product/${encodeURIComponent(productId)}/summary`
  );
  return res.data.data.summary;
}

export async function fetchStoreReputation(storeId: string) {
  const res = await api.get<ApiResponse<{ reputation: StoreReputation }>>(
    `/api/v1/customer/reviews/store/${encodeURIComponent(storeId)}/reputation`
  );
  return res.data.data.reputation;
}

export async function fetchMyReviews(
  params: ReviewListParams = {}
): Promise<ReviewListResult> {
  const search = toSearchParams(params);
  search.set("mode", "me");
  const qs = search.toString();
  const res = await api.get<ApiResponse<ReviewListResult>>(
    `/api/v1/customer/reviews?${qs}`
  );
  return res.data.data;
}

export async function createReview(body: CreateReviewInput) {
  const res = await api.post<ApiResponse<{ review: Review }>>(
    "/api/v1/customer/reviews",
    {
      productId: body.productId,
      rating: body.rating,
      ...(body.title?.trim() ? { title: body.title.trim() } : {}),
      ...(body.comment?.trim() ? { comment: body.comment.trim() } : {}),
    }
  );
  return res.data.data.review;
}

export async function updateReview(id: string, body: UpdateReviewInput) {
  const res = await api.patch<ApiResponse<{ review: Review }>>(
    `/api/v1/customer/reviews/${encodeURIComponent(id)}`,
    body
  );
  return res.data.data.review;
}

export async function deleteReview(id: string) {
  await api.delete(`/api/v1/customer/reviews/${encodeURIComponent(id)}`);
}
