import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestPayment } from "@/lib/nest-payment-mapper";
import type { Payment } from "@/modules/admin/payments/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const { id } = await params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/payments/${encodeURIComponent(id)}`, {
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

  const payment = mapNestPayment(raw);
  if (!payment) {
    return jsonMessage("Unexpected payment response", 502);
  }

  const body: ApiResponse<Payment> = { data: payment };
  return jsonOk(body);
}
