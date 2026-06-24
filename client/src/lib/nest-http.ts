import { AUTH_BACKEND_ACCESS_COOKIE } from "@/lib/auth-cookies";

function readCookieHeader(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const segment = part.trim();
    const eq = segment.indexOf("=");
    if (eq === -1) continue;
    const key = segment.slice(0, eq);
    if (key !== name) continue;
    const value = segment.slice(eq + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

/** Prefer `Authorization`, else httpOnly Nest access cookie from login/refresh. */
export function forwardAuthorization(req: Request): HeadersInit {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return { Authorization: auth };
  const backend = readCookieHeader(req, AUTH_BACKEND_ACCESS_COOKIE);
  if (backend) return { Authorization: `Bearer ${backend}` };
  return {};
}

export function nestErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed";
  const o = payload as Record<string, unknown>;
  const msg = o.message;
  if (Array.isArray(msg)) return msg.map(String).join(", ");
  if (typeof msg === "string") return msg;
  if (typeof o.error === "string") return o.error;
  return "Request failed";
}

/**
 * Nest `DataResponseInterceptor` wraps successful JSON as
 * `{ data: <handler return>, version: string }`.
 */
export function unwrapNestDataResponsePayload(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  if (typeof r.version === "string" && "data" in r) {
    return r.data;
  }
  return raw;
}

export type NestCategoryPayload = {
  id: number;
  name: string;
  deletedAt?: string | null;
  description?: string | null;
};

export function normalizeNestCategoryPayload(
  raw: unknown
): NestCategoryPayload | null {
  const payload = unwrapNestDataResponsePayload(raw);
  if (payload === null || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  const name = o.name;
  const idRaw = o.id;
  const id =
    typeof idRaw === "number" && Number.isFinite(idRaw)
      ? idRaw
      : typeof idRaw === "string" && /^\d+$/.test(idRaw.trim())
        ? Number(idRaw.trim())
        : Number.NaN;
  if (!Number.isFinite(id) || typeof name !== "string") return null;
  const description = o.description;
  return {
    id,
    name,
    description:
      typeof description === "string" || description === null
        ? (description as string | null)
        : undefined,
  };
}
