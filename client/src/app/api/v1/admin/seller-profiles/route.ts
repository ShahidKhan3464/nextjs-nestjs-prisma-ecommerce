import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestSellerProfile } from "@/lib/nest-seller-profile-mapper";
import type { SellerProfile } from "@/modules/buyer/seller-registration/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

type NestPagedSellerProfiles = {
  data?: unknown[];
  page?: number;
  limit?: number;
  total?: number;
};

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const url = new URL(req.url);
  const backend = getBackendUrl();
  const qs = url.searchParams.toString();
  const res = await fetch(`${backend}/seller-profiles${qs ? `?${qs}` : ""}`, {
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

  const inner = unwrapNestDataResponsePayload(raw) as NestPagedSellerProfiles;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected seller profiles response", 502);
  }

  const profiles: SellerProfile[] = [];
  for (const item of inner.data) {
    const mapped = mapNestSellerProfile(item);
    if (mapped) profiles.push(mapped);
  }

  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? profiles.length;

  const body: ApiResponse<{
    data: SellerProfile[];
    page: number;
    limit: number;
    total: number;
  }> = {
    data: {
      data: profiles,
      page,
      limit,
      total,
    },
  };

  return jsonOk(body);
}
