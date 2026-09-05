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

const patchSchema = z
  .object({
    businessName: z.string().trim().min(2).max(255).optional(),
    businessEmail: z.string().trim().email().max(255).optional(),
    businessPhone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(PHONE_REGEX)
      .optional(),
    taxNumber: optionalId.optional(),
    registrationNumber: optionalId.optional(),
  })
  .refine(
    (v) =>
      v.businessName !== undefined ||
      v.businessEmail !== undefined ||
      v.businessPhone !== undefined ||
      v.taxNumber !== undefined ||
      v.registrationNumber !== undefined,
    { message: "No fields provided" }
  );

function toPatchBody(data: z.infer<typeof patchSchema>) {
  const body: Record<string, string> = {};
  if (data.businessName !== undefined) body.businessName = data.businessName;
  if (data.businessEmail !== undefined) body.businessEmail = data.businessEmail;
  if (data.businessPhone !== undefined) body.businessPhone = data.businessPhone;
  if (data.taxNumber !== undefined && data.taxNumber !== "") {
    body.taxNumber = data.taxNumber;
  }
  if (
    data.registrationNumber !== undefined &&
    data.registrationNumber !== ""
  ) {
    body.registrationNumber = data.registrationNumber;
  }
  return body;
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/seller-profile/me`, {
    headers: { ...forwardAuthorization(req) },
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

export async function PATCH(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Invalid payload", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/seller-profile/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(toPatchBody(parsed.data)),
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
