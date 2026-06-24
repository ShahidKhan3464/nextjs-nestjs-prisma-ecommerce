import { cookies } from "next/headers";
import { verifyToken } from "@/lib/server-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { ACCOUNT_BLOCKED_MESSAGE } from "@/lib/account-blocked";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  AUTH_SESSION_COOKIE,
  AUTH_REFRESH_COOKIE,
  AUTH_BACKEND_ACCESS_COOKIE,
} from "@/lib/auth-cookies";

function clearAuthCookies(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.delete(AUTH_SESSION_COOKIE);
  jar.delete(AUTH_BACKEND_ACCESS_COOKIE);
  jar.delete(AUTH_REFRESH_COOKIE);
  jar.delete("shop_return_path");
}

/** Lightweight live session check against Nest (blocked users get 403). */
export async function GET(req: Request) {
  const jar = await cookies();
  const session = jar.get(AUTH_SESSION_COOKIE)?.value;
  if (!session) {
    return jsonMessage("Unauthorized", 401);
  }

  const payload = await verifyToken(session);
  if (!payload || payload.typ !== "access") {
    return jsonMessage("Unauthorized", 401);
  }

  if (payload.isBlocked) {
    clearAuthCookies(jar);
    return jsonMessage(ACCOUNT_BLOCKED_MESSAGE, 403);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/products?page=1&limit=1`, {
    headers: { ...forwardAuthorization(req) },
  });

  if (res.status === 403) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }
    clearAuthCookies(jar);
    return jsonMessage(nestErrorMessage(raw) || ACCOUNT_BLOCKED_MESSAGE, 403);
  }

  if (!res.ok) {
    return jsonMessage("Session check failed", res.status);
  }

  return jsonOk({ data: { ok: true } });
}
