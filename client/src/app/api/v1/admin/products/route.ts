import type { Product } from "@/types";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestProductDto,
  mapNestProductToAdminProduct,
} from "@/lib/nest-catalog-mapper";

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestProductDto[];
  };
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const backend = getBackendUrl();
  const qs = url.searchParams.toString();
  const res = await fetch(`${backend}/products${qs ? `?${qs}` : ""}`, {
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
    return jsonMessage("Unexpected catalog response", 502);
  }

  const products = inner.data.map(mapNestProductToAdminProduct);
  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const body: ApiResponse<{
    products: Product[];
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
  const backend = getBackendUrl();
  const formData = await req.formData();

  const res = await fetch(`${backend}/products`, {
    method: "POST",
    headers: { ...forwardAuthorization(req) },
    body: formData,
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}
