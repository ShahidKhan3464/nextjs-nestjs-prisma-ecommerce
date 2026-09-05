import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { SellerCategoryOption } from "@/modules/seller/products/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  type NestCategoryPayload,
} from "@/lib/nest-http";

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestCategoryPayload[];
  };
};

/** Read-only category list for seller product forms (mutations stay admin-only). */
export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const url = new URL(req.url);
  const params = new URLSearchParams(url.searchParams);
  if (!params.has("lifeCycle")) {
    params.set("lifeCycle", "active");
  }
  if (!params.has("limit")) {
    params.set("limit", "100");
  }
  if (!params.has("page")) {
    params.set("page", "1");
  }

  const qs = params.toString();
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/categories${qs ? `?${qs}` : ""}`, {
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

  const envelope = raw as NestPagedEnvelope;
  const inner = envelope?.data;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected categories response", 502);
  }

  const categories: SellerCategoryOption[] = inner.data
    .filter((c) => !c.deletedAt)
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
    }));

  const body: ApiResponse<{ categories: SellerCategoryOption[] }> = {
    data: { categories },
  };

  return jsonOk(body);
}
