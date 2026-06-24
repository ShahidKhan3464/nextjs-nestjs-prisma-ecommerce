import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { AdminCategoryOption } from "@/modules/admin/categories/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  type NestCategoryPayload,
  normalizeNestCategoryPayload,
} from "@/lib/nest-http";

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestCategoryPayload[];
  };
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
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

  const body: ApiResponse<{
    categories: AdminCategoryOption[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    data: {
      categories: inner.data.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        isRemoved: Boolean(category.deletedAt),
      })),
      pagination: {
        page: inner.page ?? 1,
        limit: inner.limit ?? 10,
        total: inner.total ?? inner.data.length,
        totalPages: Math.max(
          1,
          Math.ceil((inner.total ?? inner.data.length) / (inner.limit ?? 10))
        ),
      },
    },
  };

  return jsonOk(body);
}

export async function POST(req: Request) {
  const payload = await req.json();
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/categories`, {
    method: "POST",
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

  const category = normalizeNestCategoryPayload(raw);
  if (!category) {
    return jsonMessage("Unexpected category response", 502);
  }

  const body: ApiResponse<{ category: NestCategoryPayload }> = {
    data: { category },
  };
  return jsonOk(body, { status: 201 });
}
