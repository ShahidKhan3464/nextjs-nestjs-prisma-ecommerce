import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { ReviewListResult } from "@/modules/customer/reviews/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestReviewPayload,
  normalizeNestReviewPayload,
} from "@/lib/nest-review-mapper";

type NestPagedReviews = {
  data?: NestReviewPayload[];
  total?: number;
  page?: number;
  limit?: number;
};

type Ctx = { params: Promise<{ productId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { productId } = await ctx.params;
  if (!productId?.trim()) {
    return jsonMessage("productId is required", 400);
  }

  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  for (const key of ["page", "limit", "rating"] as const) {
    const value = searchParams.get(key);
    if (value) qs.set(key, value);
  }
  const q = qs.toString();

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/reviews/product/${encodeURIComponent(productId)}${q ? `?${q}` : ""}`,
    { headers: { ...forwardAuthorization(req) } }
  );

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const payload = unwrapNestDataResponsePayload(raw) as NestPagedReviews;
  const reviews = Array.isArray(payload?.data) ? payload.data : [];
  const page = payload?.page ?? Number(searchParams.get("page") ?? 1);
  const limit = payload?.limit ?? Number(searchParams.get("limit") ?? 20);
  const total = payload?.total ?? reviews.length;

  const body: ApiResponse<ReviewListResult> = {
    data: {
      reviews: reviews.map(normalizeNestReviewPayload),
      page,
      limit,
      total,
    },
  };
  return jsonOk(body);
}
