import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import type { Review } from "@/modules/buyer/reviews/types";
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

export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const backend = getBackendUrl();
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  for (const key of ["page", "limit", "rating", "productId"] as const) {
    const value = searchParams.get(key);
    if (value) qs.set(key, value);
  }
  if (!qs.get("limit")) qs.set("limit", "20");
  if (!qs.get("page")) qs.set("page", "1");
  const q = qs.toString();

  const res = await fetch(`${backend}/reviews/seller?${q}`, {
    headers: { ...forwardAuthorization(req) },
  });

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

  const body: ApiResponse<{
    reviews: Review[];
    page: number;
    limit: number;
    total: number;
  }> = {
    data: {
      reviews: reviews.map(normalizeNestReviewPayload),
      page,
      limit,
      total,
    },
  };
  return jsonOk(body);
}
