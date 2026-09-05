import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";
import type { AdminReviewListParams } from "../types";
import type { ReviewListResult } from "@/modules/buyer/reviews/types";

export async function fetchAdminReviews(
  params: AdminReviewListParams = {}
): Promise<ReviewListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.rating) search.set("rating", String(params.rating));
  if (params.productId) search.set("productId", params.productId);
  if (params.storeId) search.set("storeId", params.storeId);
  if (params.userId) search.set("userId", params.userId);
  const qs = search.toString();
  const res = await api.get<ApiResponse<ReviewListResult>>(
    `/api/v1/admin/reviews${qs ? `?${qs}` : ""}`
  );
  return res.data.data;
}

export async function deleteAdminReview(id: string) {
  const res = await api.delete<ApiResponse<{ deleted: boolean }>>(
    `/api/v1/admin/reviews/${encodeURIComponent(id)}`
  );
  return res.data.data;
}
