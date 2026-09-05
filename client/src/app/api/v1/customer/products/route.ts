import type { PaginatedResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { isSeller } from "@/modules/auth/utils/roles";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import type { Product } from "@/modules/buyer/products/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestProductPayload,
  normalizeNestProductPayload,
} from "@/lib/nest-product-mapper";

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestProductPayload[];
  };
};

/** Seller store id for shop-list exclusion. Never used when listing a specific store. */
async function resolveExcludeStoreId(
  req: Request,
  storeId: string | null
): Promise<number | undefined> {
  if (storeId) return undefined;

  const session = await getAccessTokenPayload();
  if (!session || !isSeller(session.roles)) return undefined;

  const auth = forwardAuthorization(req);
  if (!("Authorization" in auth)) return undefined;

  try {
    const res = await fetch(`${getBackendUrl()}/stores/me`, {
      headers: { ...auth },
    });
    if (!res.ok) return undefined;
    const raw: unknown = await res.json();
    const data = unwrapNestDataResponsePayload(raw);
    if (!data || typeof data !== "object") return undefined;
    const idRaw = (data as { id?: unknown }).id;
    const id =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string"
          ? Number(idRaw)
          : Number.NaN;
    return Number.isFinite(id) && id > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const backend = getBackendUrl();

  const searchParams = new URLSearchParams();

  // Map frontend parameters to backend DTO fields.
  const q = url.searchParams.get("q") || url.searchParams.get("search");
  const cat =
    url.searchParams.get("category") || url.searchParams.get("categoryId");
  const maxPrice = url.searchParams.get("maxPrice");
  const minPrice = url.searchParams.get("minPrice");
  const minRating = url.searchParams.get("minRating");
  const storeId = url.searchParams.get("storeId");
  const sellerId = url.searchParams.get("sellerId");
  const sort = url.searchParams.get("sort");
  const page = url.searchParams.get("page");
  const limit = url.searchParams.get("limit");

  if (q) searchParams.set("search", q);
  if (cat) searchParams.set("categoryId", cat);
  if (maxPrice) searchParams.set("maxPrice", maxPrice);
  if (minPrice) searchParams.set("minPrice", minPrice);
  if (minRating) searchParams.set("minRating", minRating);
  if (storeId) searchParams.set("storeId", storeId);
  if (sellerId) searchParams.set("sellerId", sellerId);
  if (sort) searchParams.set("sort", sort);
  if (page) searchParams.set("page", page);
  if (limit) searchParams.set("limit", limit);

  const excludeStoreId = await resolveExcludeStoreId(req, storeId);
  if (excludeStoreId != null) {
    searchParams.set("excludeStoreId", String(excludeStoreId));
  }

  const res = await fetch(`${backend}/products?${searchParams.toString()}`, {
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

  const body: PaginatedResponse<Product> = {
    data: inner.data.map(normalizeNestProductPayload),
    pagination: {
      page: inner.page ?? 1,
      limit: inner.limit ?? 12,
      total: inner.total ?? inner.data.length,
      totalPages: Math.max(
        1,
        Math.ceil((inner.total ?? inner.data.length) / (inner.limit ?? 12))
      ),
    },
  };

  return jsonOk(body);
}
