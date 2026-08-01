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
  toNestCreateVariantBody,
  mapNestSellerProductVariant,
  type NestSellerProductVariantDto,
} from "@/lib/nest-seller-variant-mapper";

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestSellerProductVariantDto[];
  };
};

export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/product-variants/me${qs ? `?${qs}` : ""}`,
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

  const envelope = raw as NestPagedEnvelope;
  const inner = envelope?.data;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected variants response", 502);
  }

  const variants = inner.data.map(mapNestSellerProductVariant);
  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? variants.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const body: ApiResponse<{
    variants: SellerProductVariant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    data: {
      variants,
      pagination: { page, limit, total, totalPages },
    },
  };

  return jsonOk(body);
}

export async function POST(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

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
  const productId = o.productId;
  const size = typeof o.size === "string" ? o.size : "";
  const color = typeof o.color === "string" ? o.color : "";
  const sku = typeof o.sku === "string" ? o.sku : "";
  const stock = Number(o.stock);
  const price = Number(o.price);

  if (
    productId === undefined ||
    productId === null ||
    !Number.isFinite(Number(productId)) ||
    Number(productId) < 1
  ) {
    return jsonMessage("productId is required", 400);
  }
  if (!size.trim() || !color.trim() || sku.trim().length < 2) {
    return jsonMessage("size, color, and sku are required", 400);
  }
  if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
    return jsonMessage("stock must be a non-negative integer", 400);
  }
  if (!Number.isFinite(price) || price <= 0) {
    return jsonMessage("price must be greater than 0", 400);
  }

  const backend = getBackendUrl();
  const nestBody = toNestCreateVariantBody({
    productId: Number(productId),
    size,
    color,
    sku,
    stock,
    price,
  });

  const res = await fetch(`${backend}/product-variants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(nestBody),
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
  return jsonOk(body, { status: 201 });
}
