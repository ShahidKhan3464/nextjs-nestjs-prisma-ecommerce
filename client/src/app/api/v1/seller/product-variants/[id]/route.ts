import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { SellerProductVariant } from "@/modules/seller/products/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  toNestUpdateVariantBody,
  mapNestSellerProductVariant,
  type NestSellerProductVariantDto,
} from "@/lib/nest-seller-variant-mapper";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  if (!json || typeof json !== "object") {
    return jsonMessage("Invalid request body", 400);
  }

  const o = json as Record<string, unknown>;
  const patch: {
    size?: string;
    color?: string;
    sku?: string;
    stock?: number;
    price?: number;
  } = {};

  if (typeof o.size === "string") patch.size = o.size;
  if (typeof o.color === "string") patch.color = o.color;
  if (typeof o.sku === "string") patch.sku = o.sku;
  if (o.stock !== undefined) {
    const stock = Number(o.stock);
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return jsonMessage("stock must be a non-negative integer", 400);
    }
    patch.stock = stock;
  }
  if (o.price !== undefined) {
    const price = Number(o.price);
    if (!Number.isFinite(price) || price < 0) {
      return jsonMessage("price must be a non-negative number", 400);
    }
    patch.price = price;
  }

  if (Object.keys(patch).length === 0) {
    return jsonMessage("No fields provided to update", 400);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/product-variants/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...forwardAuthorization(req),
      },
      body: JSON.stringify(toNestUpdateVariantBody(patch)),
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
    return jsonMessage("Unexpected variant response", 502);
  }

  const variant = mapNestSellerProductVariant(
    payload as NestSellerProductVariantDto
  );
  const body: ApiResponse<{ variant: SellerProductVariant }> = {
    data: { variant },
  };
  return jsonOk(body);
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/product-variants/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
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

  const body: ApiResponse<{ ok: true }> = { data: { ok: true } };
  return jsonOk(body);
}
