import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { UserAddress } from "@/modules/buyer/addresses/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import {
  type NestAddressPayload,
  normalizeNestAddressPayload,
} from "@/lib/nest-address-mapper";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const res = await fetch(
    `${backend}/addresses/${encodeURIComponent(id)}/default`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...forwardAuthorization(req),
      },
      body: JSON.stringify(payload),
    }
  );

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
  return jsonOk(body);
}
