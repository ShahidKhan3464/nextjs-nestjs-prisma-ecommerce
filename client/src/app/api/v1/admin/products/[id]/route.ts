import { requireAdmin } from "@/lib/require-auth";
import type { Product } from "@/types";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  type NestProductDto,
  mapNestProductToAdminProduct,
} from "@/lib/nest-catalog-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const backend = getBackendUrl();
  const { id } = await ctx.params;
  const res = await fetch(`${backend}/products/${encodeURIComponent(id)}`, {
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

  const payload = unwrapNestDataResponsePayload(raw);
  if (payload === null || typeof payload !== "object") {
    return jsonMessage("Unexpected product response", 502);
  }

  const product = mapNestProductToAdminProduct(payload as NestProductDto);
  const body: ApiResponse<Product> = { data: product };
  return jsonOk(body);
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
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
    body: isMultipart ? await req.formData() : JSON.stringify(await req.json()),
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

export async function DELETE(req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/products/${encodeURIComponent(id)}`, {
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
