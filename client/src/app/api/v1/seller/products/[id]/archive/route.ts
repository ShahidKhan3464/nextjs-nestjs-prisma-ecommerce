import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { SellerProduct } from "@/modules/seller/products/types";
import {
  type NestSellerProductDto,
  mapNestSellerProduct,
} from "@/lib/nest-seller-product-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/products/${encodeURIComponent(id)}/archive`,
    {
      method: "PATCH",
      headers: { ...forwardAuthorization(req) },
    }
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

  const payload = unwrapNestDataResponsePayload(raw);
  if (payload === null || typeof payload !== "object") {
    const body: ApiResponse<{ ok: true }> = { data: { ok: true } };
    return jsonOk(body);
  }

  const product = mapNestSellerProduct(payload as NestSellerProductDto);
  const body: ApiResponse<{ product: SellerProduct }> = { data: { product } };
  return jsonOk(body);
}
