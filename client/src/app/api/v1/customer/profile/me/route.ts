import { z } from "zod";
import type { User } from "@/types";
import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { type NestUserDto, mapNestUserToClient } from "@/lib/nest-user-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

const patchSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/users/me`, {
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
    return jsonMessage("Unexpected profile response", 502);
  }

  const mapped = mapNestUserToClient(payload as NestUserDto);
  const body: ApiResponse<{ user: User }> = { data: { user: mapped } };
  return jsonOk(body);
}

export async function PATCH(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Invalid payload", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(parsed.data),
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
    return jsonMessage("Unexpected profile response", 502);
  }

  const mapped = mapNestUserToClient(payload as NestUserDto);
  const body: ApiResponse<{ user: User }> = { data: { user: mapped } };
  return jsonOk(body);
}
