import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";
import type {
  ReviewListParams,
  ReviewListResult,
} from "@/modules/customer/reviews/types";

export async function fetchSellerReviews(
  params: ReviewListParams = {}
): Promise<ReviewListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.rating) search.set("rating", String(params.rating));
  const qs = search.toString();
  const res = await api.get<ApiResponse<ReviewListResult>>(
    `/api/v1/seller/reviews${qs ? `?${qs}` : ""}`
  );
  return res.data.data;
}
