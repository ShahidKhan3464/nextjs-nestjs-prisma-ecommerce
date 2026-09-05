import { z } from "zod";
import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestSellerProfile } from "@/lib/nest-seller-profile-mapper";
import type { SellerProfile } from "@/modules/buyer/seller-registration/types";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

type Props = { params: Promise<{ id: string }> };

const suspendSchema = z.object({
  suspensionReason: z.string().trim().max(1000).optional(),
});

export async function PATCH(req: Request, { params }: Props) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const backend = getBackendUrl();

  let bodyData: unknown = {};
  try {
    bodyData = await req.json();
  } catch {
    bodyData = {};
  }

  const parsed = suspendSchema.safeParse(bodyData);
  if (!parsed.success) {
    return jsonMessage("Invalid suspension payload", 422);
  }

  const payload: Record<string, string> = {};
  const reason = parsed.data.suspensionReason?.trim();
  if (reason) payload.suspensionReason = reason;

  const res = await fetch(
    `${backend}/seller-profile/${encodeURIComponent(id)}/suspend`,
    {
      method: "PATCH",
      headers: {
        ...forwardAuthorization(req),
        "Content-Type": "application/json",
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

  const profile = mapNestSellerProfile(raw);
  if (!profile) {
    return jsonMessage("Unexpected seller profile response", 502);
  }

  const body: ApiResponse<SellerProfile> = { data: profile };
  return jsonOk(body);
}
