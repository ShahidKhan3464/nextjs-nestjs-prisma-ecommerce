import { z } from "zod";
import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestPayment } from "@/lib/nest-payment-mapper";
import type { Payment } from "@/modules/admin/payments/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

type Props = { params: Promise<{ id: string }> };

const refundSchema = z.object({
  reason: z.string().trim().min(1).max(255),
  amount: z.number().min(0.01).optional(),
  externalRefundId: z.string().trim().max(255).optional(),
});

export async function POST(req: Request, { params }: Props) {
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

  const parsed = refundSchema.safeParse(bodyData);
  if (!parsed.success) {
    return jsonMessage("Invalid refund payload", 422);
  }

  const payload: Record<string, string | number> = {
    reason: parsed.data.reason,
  };
  if (parsed.data.amount != null) payload.amount = parsed.data.amount;
  if (parsed.data.externalRefundId) {
    payload.externalRefundId = parsed.data.externalRefundId;
  }

  const res = await fetch(
    `${backend}/payments/${encodeURIComponent(id)}/refunds`,
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
