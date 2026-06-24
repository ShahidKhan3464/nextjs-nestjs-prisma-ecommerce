import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  type NestProductPayload,
  normalizeNestProductPayload,
} from "@/lib/nest-product-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

/**
 * Extract a numeric id from the end of a slug like "nike-shoes-6" -> 6.
 * Falls back to treating the whole string as an id if it is purely numeric.
 */
function extractIdFromSlug(slug: string): string | null {
  if (/^\d+$/.test(slug)) return slug;
  const match = slug.match(/-(\d+)$/);
  if (match) return match[1];
  return null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const backend = getBackendUrl();

  const id = extractIdFromSlug(slug);
  const backendUrl = id
    ? `${backend}/products/${encodeURIComponent(id)}`
    : `${backend}/products/detail/${encodeURIComponent(slug)}`;

  const res = await fetch(backendUrl, {
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

  const payload = unwrapNestDataResponsePayload(raw) as NestProductPayload;
  if (!payload) {
    return jsonMessage("Product not found", 404);
  }

  return jsonOk({
    data: normalizeNestProductPayload(payload),
  });
}
