import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { Review } from "@/modules/buyer/reviews/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestReviewPayload,
  normalizeNestReviewPayload,
} from "@/lib/nest-review-mapper";

type NestPagedReviews = {
  data?: NestReviewPayload[];
  total?: number;
  page?: number;
  limit?: number;
};

function mapPaged(
  payload: NestPagedReviews | null | undefined,
  searchParams: URLSearchParams
) {
  const reviews = Array.isArray(payload?.data) ? payload.data : [];
  const page = payload?.page ?? Number(searchParams.get("page") ?? 1);
  const limit = payload?.limit ?? Number(searchParams.get("limit") ?? 20);
  const total = payload?.total ?? reviews.length;
  return {
    reviews: reviews.map(normalizeNestReviewPayload),
    page,
    limit,
    total,
  };
}

export async function GET(req: Request) {
  const backend = getBackendUrl();
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const productId = searchParams.get("productId");

  let path: string;
  if (mode === "me") {
    const qs = new URLSearchParams();
    for (const key of ["page", "limit", "rating", "productId"] as const) {
      const value = searchParams.get(key);
      if (value) qs.set(key, value);
    }
    const q = qs.toString();
    path = `/reviews/me${q ? `?${q}` : ""}`;
  } else if (productId) {
    const qs = new URLSearchParams();
    for (const key of ["page", "limit", "rating"] as const) {
      const value = searchParams.get(key);
      if (value) qs.set(key, value);
    }
    const q = qs.toString();
    path = `/reviews/product/${encodeURIComponent(productId)}${q ? `?${q}` : ""}`;
  } else {
    return jsonMessage("productId or mode=me is required", 400);
  }

  const res = await fetch(`${backend}${path}`, {
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

  const payload = unwrapNestDataResponsePayload(raw) as NestPagedReviews;
  const body: ApiResponse<ReturnType<typeof mapPaged>> = {
    data: mapPaged(payload, searchParams),
  };
  return jsonOk(body);
}

export async function POST(req: Request) {
  const backend = getBackendUrl();
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const bodyIn =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  if (!bodyIn) {
    return jsonMessage("Invalid JSON body", 400);
  }

  const nestBody = {
    ...bodyIn,
    productId:
      typeof bodyIn.productId === "string"
        ? Number(bodyIn.productId)
        : bodyIn.productId,
  };

  const res = await fetch(`${backend}/reviews`, {
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

  const data = unwrapNestDataResponsePayload(raw) as NestReviewPayload;
  const body: ApiResponse<{ review: Review }> = {
    data: { review: normalizeNestReviewPayload(data) },
  };
  return jsonOk(body, { status: 201 });
}
