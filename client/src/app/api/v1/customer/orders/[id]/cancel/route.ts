import { z } from "zod";
import { getBackendUrl } from "@/lib/backend-url";
import type { ApiResponse, Order } from "@/types";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

const cancelSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = cancelSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Cancellation reason is required", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/orders/${encodeURIComponent(id)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...forwardAuthorization(req),
      },
      body: JSON.stringify(parsed.data),
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

  const envelope = raw as { data?: NestOrderPayload };
  const orderRaw = envelope?.data;
  if (!orderRaw) {
    return jsonMessage("Invalid cancel response", 500);
  }

  const body: ApiResponse<{ order: Order }> = {
    data: { order: normalizeNestOrderPayload(orderRaw) },
  };
  return jsonOk(body);
}
