import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { StoreReputation } from "@/modules/customer/reviews/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestStoreReputationPayload,
  normalizeNestStoreReputationPayload,
} from "@/lib/nest-review-mapper";

type Ctx = { params: Promise<{ storeId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { storeId } = await ctx.params;
  if (!storeId?.trim()) {
    return jsonMessage("storeId is required", 400);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/reviews/store/${encodeURIComponent(storeId)}/reputation`,
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

  const data = unwrapNestDataResponsePayload(raw) as NestStoreReputationPayload;
  const body: ApiResponse<{ reputation: StoreReputation }> = {
    data: { reputation: normalizeNestStoreReputationPayload(data) },
  };
  return jsonOk(body);
}
