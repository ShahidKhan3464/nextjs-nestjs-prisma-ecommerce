import { z } from "zod";
import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestSellerProfile } from "@/lib/nest-seller-profile-mapper";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import { SELLER_DOCUMENT_TYPES } from "@/modules/buyer/seller-registration/types";

const typeSchema = z.enum(SELLER_DOCUMENT_TYPES);

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonMessage("Invalid form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonMessage("Document file is required", 422);
  }

  const typeRaw = formData.get("type");
  const parsedType = typeSchema.safeParse(
    typeof typeRaw === "string" ? typeRaw : undefined
  );
  if (!parsedType.success) {
    return jsonMessage("Valid document type is required", 422);
  }

  const outbound = new FormData();
  outbound.append("file", file);
  outbound.append("type", parsedType.data);

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/seller-profile/me/documents`, {
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

  const profile = mapNestSellerProfile(raw);
  if (!profile) {
    return jsonMessage("Unexpected seller profile response", 502);
  }

  const body: ApiResponse<{ profile: typeof profile }> = { data: { profile } };
  return jsonOk(body);
}
