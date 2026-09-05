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

const rejectSchema = z.object({
  rejectedReason: z.string().trim().min(5).max(1000),
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
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = rejectSchema.safeParse(bodyData);
  if (!parsed.success) {
    return jsonMessage("Rejection reason must be 5–1000 characters", 422);
  }

  const res = await fetch(
    `${backend}/seller-profile/${encodeURIComponent(id)}/reject`,
    {
      method: "PATCH",
      headers: {
        ...forwardAuthorization(req),
        "Content-Type": "application/json",
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

  const profile = mapNestSellerProfile(raw);
  if (!profile) {
    return jsonMessage("Unexpected seller profile response", 502);
  }

  const body: ApiResponse<SellerProfile> = { data: profile };
  return jsonOk(body);
}
