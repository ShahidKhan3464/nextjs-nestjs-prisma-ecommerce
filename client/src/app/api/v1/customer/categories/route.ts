import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, type NestCategoryPayload } from "@/lib/nest-http";

type NestPagedEnvelope = {
  data?: {
    page?: number;
    limit?: number;
    total?: number;
    data?: NestCategoryPayload[];
  };
};

export type CustomerCategoryOption = {
  id: number;
  name: string;
  description: string | null;
};

/** Public active categories for storefront product filters. */
export async function GET() {
  const backend = getBackendUrl();
  const params = new URLSearchParams({
    lifeCycle: "active",
    limit: "100",
    page: "1",
  });

  const res = await fetch(`${backend}/categories?${params.toString()}`);

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const envelope = raw as NestPagedEnvelope;
  const inner = envelope?.data;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected categories response", 502);
  }

  const categories: CustomerCategoryOption[] = inner.data
    .filter((c) => !c.deletedAt)
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? null,
    }));

  const body: ApiResponse<{ categories: CustomerCategoryOption[] }> = {
    data: { categories },
  };

  return jsonOk(body);
}
