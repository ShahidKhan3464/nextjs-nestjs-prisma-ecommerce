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

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestSellerProductDto[];
  };
};

/** Never forward client storeId — Nest resolves store from the seller session. */
function stripUntrustedStoreId(formData: FormData): FormData {
  const next = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key === "storeId") continue;
    next.append(key, value);
  }
  return next;
}

export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/products/me${qs ? `?${qs}` : ""}`, {
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
    return jsonMessage("Unexpected products response", 502);
  }

  const products = inner.data.map(mapNestSellerProduct);
  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const body: ApiResponse<{
    products: SellerProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    data: {
      products,
      pagination: { page, limit, total, totalPages },
    },
  };

  return jsonOk(body);
}

export async function POST(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const backend = getBackendUrl();
  const formData = stripUntrustedStoreId(await req.formData());

  const res = await fetch(`${backend}/products`, {
    method: "POST",
    headers: { ...forwardAuthorization(req) },
    body: formData,
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
    return jsonMessage("Unexpected product response", 502);
  }

  const product = mapNestSellerProduct(payload as NestSellerProductDto);
  const body: ApiResponse<{ product: SellerProduct }> = { data: { product } };
  return jsonOk(body, { status: 201 });
}
