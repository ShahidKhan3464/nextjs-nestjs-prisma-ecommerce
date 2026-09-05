import { z } from "zod";
import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestSellerProfile } from "@/lib/nest-seller-profile-mapper";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

const PHONE_REGEX = /^[+\d][\d\s()-]{6,29}$/;
const ID_NUMBER_REGEX = /^[A-Za-z0-9\-./]+$/;

const optionalId = z
  .string()
  .trim()
  .max(50)
  .refine((value) => value === "" || ID_NUMBER_REGEX.test(value));

const createSchema = z.object({
  businessName: z.string().trim().min(2).max(255),
  businessEmail: z.string().trim().email().max(255),
  businessPhone: z.string().trim().min(7).max(30).regex(PHONE_REGEX),
  taxNumber: optionalId.optional(),
  registrationNumber: optionalId.optional(),
});

function toCreateBody(data: z.infer<typeof createSchema>) {
  return {
    businessName: data.businessName,
    businessEmail: data.businessEmail,
    businessPhone: data.businessPhone,
    ...(data.taxNumber ? { taxNumber: data.taxNumber } : {}),
    ...(data.registrationNumber
      ? { registrationNumber: data.registrationNumber }
      : {}),
  };
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Invalid payload", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/seller-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(toCreateBody(parsed.data)),
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
  return jsonOk(body, { status: 201 });
}
