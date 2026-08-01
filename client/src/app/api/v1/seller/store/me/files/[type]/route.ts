import { z } from "zod";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { mapNestStore } from "@/lib/nest-store-mapper";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { STORE_FILE_TYPES } from "@/modules/seller/store/types";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

const typeSchema = z.enum(STORE_FILE_TYPES);

type RouteContext = {
  params: Promise<{ type: string }>;
};

export async function DELETE(req: Request, context: RouteContext) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { type: typeParam } = await context.params;
  const parsedType = typeSchema.safeParse(typeParam?.toUpperCase());
  if (!parsedType.success) {
    return jsonMessage("Valid file type is required (LOGO or BANNER)", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/stores/me/files/${parsedType.data}`,
    {
      method: "DELETE",
      headers: { ...forwardAuthorization(req) },
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

  const store = mapNestStore(raw);
  if (!store) {
    return jsonMessage("Unexpected store response", 502);
  }

  const body: ApiResponse<{ store: typeof store }> = { data: { store } };
  return jsonOk(body);
}
