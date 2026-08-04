import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { Review } from "@/modules/customer/reviews/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestReviewPayload,
  normalizeNestReviewPayload,
} from "@/lib/nest-review-mapper";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const res = await fetch(`${backend}/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(payload),
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

  const data = unwrapNestDataResponsePayload(raw) as NestReviewPayload;
  const body: ApiResponse<{ review: Review }> = {
    data: { review: normalizeNestReviewPayload(data) },
  };
  return jsonOk(body);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...forwardAuthorization(req) },
  });

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  return jsonOk({ data: { deleted: true } });
}
