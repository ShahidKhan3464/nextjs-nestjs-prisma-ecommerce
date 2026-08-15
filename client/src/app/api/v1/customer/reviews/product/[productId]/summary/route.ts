import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { ReviewSummary } from "@/modules/buyer/reviews/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestReviewSummaryPayload,
  normalizeNestReviewSummaryPayload,
} from "@/lib/nest-review-mapper";

type Ctx = { params: Promise<{ productId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { productId } = await ctx.params;
  if (!productId?.trim()) {
    return jsonMessage("productId is required", 400);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/reviews/product/${encodeURIComponent(productId)}/summary`,
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

  const data = unwrapNestDataResponsePayload(raw) as NestReviewSummaryPayload;
  const body: ApiResponse<{ summary: ReviewSummary }> = {
    data: { summary: normalizeNestReviewSummaryPayload(data) },
  };
  return jsonOk(body);
}
