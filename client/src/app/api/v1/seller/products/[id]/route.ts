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

type NestPagedInner = {
  page?: number;
  limit?: number;
  total?: number;
  data?: NestSellerProductDto[];
};

/**
 * Nest `GET /products/:id` only returns ACTIVE, non-deleted rows.
 * Seller drafts/archived/removed need a scan of `/products/me` (store-scoped).
 */
async function findSellerProductById(
  req: Request,
  id: string
): Promise<SellerProduct | null | Response> {
  const backend = getBackendUrl();
  const auth = forwardAuthorization(req);
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return null;
  }

  const activeRes = await fetch(
    `${backend}/products/${encodeURIComponent(id)}`,
    { headers: { ...auth } }
  );
  if (activeRes.ok) {
    let raw: unknown = null;
    try {
      raw = await activeRes.json();
    } catch {
      raw = null;
    }
    const payload = unwrapNestDataResponsePayload(raw);
    if (payload && typeof payload === "object") {
      return mapNestSellerProduct(payload as NestSellerProductDto);
    }
  }

  const pageSize = 50;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 40) {
    const res = await fetch(
      `${backend}/products/me?lifeCycle=all&limit=${pageSize}&page=${page}`,
      { headers: { ...auth } }
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

    const inner = (raw as { data?: NestPagedInner })?.data;
    if (!inner || !Array.isArray(inner.data)) {
      return jsonMessage("Unexpected products response", 502);
    }

    const limit = inner.limit ?? pageSize;
    const total = inner.total ?? inner.data.length;
    totalPages = Math.max(1, Math.ceil(total / limit));

    const match = inner.data.find((row) => row.id === numericId);
    if (match) {
      return mapNestSellerProduct(match);
    }

    page += 1;
  }

  return null;
}

function stripUntrustedStoreId(formData: FormData): FormData {
  const next = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key === "storeId") continue;
    next.append(key, value);
  }
  return next;
}

export async function GET(req: Request, ctx: RouteCtx) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await ctx.params;
  const result = await findSellerProductById(req, id);
  if (result instanceof Response) return result;
  if (!result) {
    return jsonMessage("Product not found", 404);
  }

  const body: ApiResponse<{ product: SellerProduct }> = {
    data: { product: result },
  };
  return jsonOk(body);
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  const res = await fetch(`${backend}/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: isMultipart
      ? { ...forwardAuthorization(req) }
      : {
          "Content-Type": "application/json",
          ...forwardAuthorization(req),
        },
    body: isMultipart
      ? stripUntrustedStoreId(await req.formData())
      : JSON.stringify(await req.json()),
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
    const body: ApiResponse<{ ok: true }> = { data: { ok: true } };
    return jsonOk(body);
  }

  const product = mapNestSellerProduct(payload as NestSellerProductDto);
  const body: ApiResponse<{ product: SellerProduct }> = { data: { product } };
  return jsonOk(body);
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
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

  const body: ApiResponse<{ ok: true }> = { data: { ok: true } };
  return jsonOk(body);
}
