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

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Props) {
  const { id } = await params;
  const backend = getBackendUrl();

  let bodyData: unknown = {};
  try {
    bodyData = await req.json();
  } catch {
    // Keep an empty payload so Nest can return the proper validation error.
  }

  const res = await fetch(`${backend}/users/${id}/block`, {
    method: "PATCH",
    headers: {
      ...forwardAuthorization(req),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
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
    return jsonMessage("Unexpected user response", 502);
  }

  const user = mapNestUserToClient(payload as NestUserDto);
  const body: ApiResponse<User> = { data: user };
  return jsonOk(body);
}
