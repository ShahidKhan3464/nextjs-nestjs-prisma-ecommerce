import { z } from "zod";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestPayment } from "@/lib/nest-payment-mapper";
import type { Payment } from "@/modules/admin/payments/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

type Props = { params: Promise<{ id: string }> };

const rejectSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export async function POST(req: Request, { params }: Props) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await params;
  const backend = getBackendUrl();

  let bodyData: unknown = {};
  try {
    bodyData = await req.json();
  } catch {
    bodyData = {};
  }

  const parsed = rejectSchema.safeParse(bodyData);
  if (!parsed.success) {
    return jsonMessage("Invalid COD reject payload", 422);
  }

  const payload: Record<string, string> = {};
  const reason = parsed.data.reason?.trim();
  if (reason) payload.reason = reason;

  const res = await fetch(
    `${backend}/payments/${encodeURIComponent(id)}/cod/reject`,
    {
      method: "POST",
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

  const payment = mapNestPayment(raw);
  if (!payment) {
    return jsonMessage("Unexpected payment response", 502);
  }

  const body: ApiResponse<Payment> = { data: payment };
  return jsonOk(body);
}
