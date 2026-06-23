import { z } from "zod";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";

const bodySchema = z.object({
  email: z.string().email(),
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
    return jsonMessage("Validation failed", 422);
  }

  const { email } = parsed.data;

  const res = await fetch(`${getBackendUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  let payload: { message?: string } | null = null;

  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    return jsonMessage(
      payload?.message || "Failed to send reset email",
      res.status
    );
  }

  const response: ApiResponse<{ sent: boolean }> = {
    data: {
      sent: true,
    },
  };

  return jsonOk(response);
}
