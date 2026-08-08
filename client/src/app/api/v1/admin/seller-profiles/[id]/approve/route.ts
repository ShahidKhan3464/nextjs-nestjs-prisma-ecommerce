import { z } from "zod";
import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestSellerProfile } from "@/lib/nest-seller-profile-mapper";
import type { SellerProfile } from "@/modules/customer/seller-registration/types";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

type Props = { params: Promise<{ id: string }> };

const approveSchema = z.object({
  address: z.string().trim().min(2).max(255),
  city: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(100),
  storeName: z.string().trim().min(2).max(255).optional(),
  description: z.string().trim().max(2000).optional(),
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

  const parsed = approveSchema.safeParse(bodyData);
  if (!parsed.success) {
    return jsonMessage("Invalid approval payload", 422);
  }

  const payload: Record<string, string> = {
    address: parsed.data.address,
    city: parsed.data.city,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
  };
  if (parsed.data.storeName) payload.storeName = parsed.data.storeName;
  if (parsed.data.description) payload.description = parsed.data.description;

  const res = await fetch(
    `${backend}/seller-profile/${encodeURIComponent(id)}/approve`,
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
