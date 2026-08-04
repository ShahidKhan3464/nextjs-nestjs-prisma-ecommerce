import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { UserAddress } from "@/modules/customer/addresses/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestAddressPayload,
  normalizeNestAddressPayload,
} from "@/lib/nest-address-mapper";

export async function GET(req: Request) {
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/addresses`, {
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
  const list = Array.isArray(payload) ? (payload as NestAddressPayload[]) : [];

  const body: ApiResponse<{ addresses: UserAddress[] }> = {
    data: { addresses: list.map(normalizeNestAddressPayload) },
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

  const res = await fetch(`${backend}/addresses`, {
    method: "POST",
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

  const data = unwrapNestDataResponsePayload(raw) as NestAddressPayload;
  const body: ApiResponse<{ address: UserAddress }> = {
    data: { address: normalizeNestAddressPayload(data) },
  };
  return jsonOk(body, { status: 201 });
}
