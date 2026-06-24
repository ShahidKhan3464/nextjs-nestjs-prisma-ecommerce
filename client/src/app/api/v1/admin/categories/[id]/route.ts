import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
  type NestCategoryPayload,
  normalizeNestCategoryPayload,
} from "@/lib/nest-http";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/categories/${encodeURIComponent(id)}`, {
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

  const category = normalizeNestCategoryPayload(raw);
  if (!category) {
    return jsonMessage("Unexpected category response", 502);
  }

  const body: ApiResponse<{ category: NestCategoryPayload }> = {
    data: { category },
  };
  return jsonOk(body);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const payload = await req.json();
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/categories/${encodeURIComponent(id)}`, {
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

  const category = normalizeNestCategoryPayload(raw);
  if (!category) {
    return jsonMessage("Unexpected category response", 502);
  }

  const body: ApiResponse<{ category: NestCategoryPayload }> = {
    data: { category },
  };
  return jsonOk(body);
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...forwardAuthorization(req) },
  });

  const text = await res.text();
  let raw: unknown = null;
  if (text) {
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      raw = { message: text };
    }
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const body: ApiResponse<{ ok: true }> = { data: { ok: true } };
  return jsonOk(body);
}
