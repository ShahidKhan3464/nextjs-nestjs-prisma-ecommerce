import { z } from "zod";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { mapNestStore } from "@/lib/nest-store-mapper";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    address: z.string().trim().min(2).max(255).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    postalCode: z.string().trim().min(1).max(20).optional(),
    country: z.string().trim().min(2).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided to update",
  });

async function parseNestStoreResponse(res: Response) {
  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const store = mapNestStore(raw);
  if (!store) {
    return jsonMessage("Unexpected store response", 502);
  }

  const body: ApiResponse<{ store: typeof store }> = { data: { store } };
  return jsonOk(body);
}

export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/stores/me`, {
    headers: { ...forwardAuthorization(req) },
  });

  return parseNestStoreResponse(res);
}

export async function PATCH(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage(
      parsed.error.issues[0]?.message ?? "Invalid payload",
      422
    );
  }

  const payload: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (key === "description" && value === "") {
      payload.description = "";
      continue;
    }
    payload[key] = value;
  }

  if (Object.keys(payload).length === 0) {
    return jsonMessage("No fields provided to update", 400);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/stores/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(payload),
  });

  return parseNestStoreResponse(res);
}
