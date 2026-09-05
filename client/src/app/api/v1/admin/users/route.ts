import { requireAdmin } from "@/lib/require-auth";
import type { User } from "@/types";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { type NestUserDto, mapNestUserToClient } from "@/lib/nest-user-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

type NestPagedUsers = {
  data?: NestUserDto[];
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
  const res = await fetch(`${backend}/users${qs ? `?${qs}` : ""}`, {
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

  const inner = unwrapNestDataResponsePayload(raw) as NestPagedUsers;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected users response", 502);
  }

  const users: User[] = inner.data.map(mapNestUserToClient);
  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? users.length;

  const body: ApiResponse<{
    data: User[];
    page: number;
    limit: number;
    total: number;
  }> = {
    data: {
      data: users,
      page,
      limit,
      total,
    },
  };

  return jsonOk(body);
}
