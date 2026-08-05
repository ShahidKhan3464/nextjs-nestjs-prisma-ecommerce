import { z } from "zod";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import { requireUser } from "@/lib/require-auth";

const cancelSchema = z.object({
  paymentIntentId: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = cancelSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Invalid cancel payload", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/orders/checkout/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  return jsonOk({ data: { cancelled: true } });
}
