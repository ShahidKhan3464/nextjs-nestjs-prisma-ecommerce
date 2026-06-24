import { z } from "zod";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const bodySchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(30, "Password is too long")
      .regex(
        PASSWORD_PATTERN,
        "Include upper & lowercase, a number, and a special character (@$!%*?&)"
      ),
    confirmPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(30, "Password is too long")
      .regex(
        PASSWORD_PATTERN,
        "Include upper & lowercase, a number, and a special character (@$!%*?&)"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      (first.token?.[0] ||
        first.password?.[0] ||
        first.confirmPassword?.[0] ||
        parsed.error.flatten().formErrors[0]) ??
      "Validation failed";
    return jsonMessage(msg, 422);
  }

  const { token, password, confirmPassword } = parsed.data;

  const res = await fetch(`${getBackendUrl()}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password, confirmPassword }),
  });

  let payload: { message?: string | string[] } | null = null;

  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const raw = payload?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : typeof raw === "string"
        ? raw
        : "Could not reset password";
    return jsonMessage(message, res.status);
  }

  const response: ApiResponse<{ reset: true }> = {
    data: {
      reset: true,
    },
  };

  return jsonOk(response);
}
