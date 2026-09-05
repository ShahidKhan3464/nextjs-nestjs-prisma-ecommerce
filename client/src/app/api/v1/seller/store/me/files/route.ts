import { z } from "zod";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { mapNestStore } from "@/lib/nest-store-mapper";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { STORE_FILE_TYPES } from "@/modules/seller/store/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

const typeSchema = z.enum(STORE_FILE_TYPES);

export async function POST(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonMessage("Invalid form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonMessage("Image file is required", 422);
  }

  const typeRaw = formData.get("type");
  const parsedType = typeSchema.safeParse(
    typeof typeRaw === "string" ? typeRaw : undefined
  );
  if (!parsedType.success) {
    return jsonMessage("Valid file type is required (LOGO or BANNER)", 422);
  }

  const outbound = new FormData();
  outbound.append("file", file);
  outbound.append("type", parsedType.data);

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/stores/me/files`, {
    method: "POST",
    headers: { ...forwardAuthorization(req) },
    body: outbound,
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

  const store = mapNestStore(raw);
  if (!store) {
    return jsonMessage("Unexpected store response", 502);
  }

  const body: ApiResponse<{ store: typeof store }> = { data: { store } };
  return jsonOk(body);
}
