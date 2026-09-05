import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import type {
  WishlistAvailability,
  WishlistItem,
  WishlistStore,
} from "@/modules/buyer/wishlist/types";

type NestWishlistStore = {
  id: string | number;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl?: string | null;
  sellerName: string;
};

type NestWishlistItem = {
  id: string | number;
  name: string;
  slug: string;
  image?: string | null;
  basePrice: number;
  availability: WishlistAvailability;
  totalStock: number;
  store?: NestWishlistStore | null;
};

type NestWishlistPayload = {
  productIds?: Array<string | number>;
  items?: NestWishlistItem[];
};

function mapStore(store?: NestWishlistStore | null): WishlistStore | null {
  if (!store) return null;
  return {
    id: String(store.id),
    name: store.name,
    slug: store.slug,
    verified: Boolean(store.verified),
    logoUrl: resolveUploadUrl(store.logoUrl) ?? null,
    sellerName: store.sellerName,
  };
}

function mapItem(item: NestWishlistItem): WishlistItem {
  return {
    id: String(item.id),
    name: item.name,
    slug: item.slug,
    image: resolveUploadUrl(item.image) ?? null,
    basePrice: Number(item.basePrice),
    availability: item.availability,
    totalStock: item.totalStock,
    store: mapStore(item.store),
  };
}

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/wishlist`, {
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

  if (Array.isArray(payload)) {
    const productIds = payload.map((id) => String(id));
    const body: ApiResponse<{ productIds: string[]; items: WishlistItem[] }> = {
      data: { productIds, items: [] },
    };
    return jsonOk(body);
  }

  const data = (payload ?? {}) as NestWishlistPayload;
  const productIds = (data.productIds ?? []).map((id) => String(id));
  const items = (data.items ?? []).map(mapItem);

  const body: ApiResponse<{ productIds: string[]; items: WishlistItem[] }> = {
    data: { productIds, items },
  };
  return jsonOk(body);
}
