import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { mapNestPayment } from "@/lib/nest-payment-mapper";
import type { Payment } from "@/modules/admin/payments/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

type NestPagedPayments = {
  data?: unknown[];
  page?: number;
  limit?: number;
  total?: number;
};

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const url = new URL(req.url);
  const backend = getBackendUrl();
  const qs = url.searchParams.toString();
  const res = await fetch(
    `${backend}/payments/admin/all${qs ? `?${qs}` : ""}`,
    {
      headers: { ...forwardAuthorization(req) },
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

  const inner = unwrapNestDataResponsePayload(raw) as NestPagedPayments;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected payments response", 502);
  }

  const payments: Payment[] = [];
  for (const item of inner.data) {
    const mapped = mapNestPayment(item);
    if (mapped) payments.push(mapped);
  }

  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? payments.length;

  const body: ApiResponse<{
    data: Payment[];
    page: number;
    limit: number;
    total: number;
  }> = {
    data: {
      data: payments,
      page,
      limit,
      total,
    },
  };

  return jsonOk(body);
}
