import { cookies } from "next/headers";
import type { UserRole } from "@/types";
import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { nestErrorMessage } from "@/lib/nest-http";
import { signAccessToken } from "@/lib/server-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { ACCOUNT_BLOCKED_MESSAGE } from "@/lib/account-blocked";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@/lib/auth-token-durations";
import {
  AUTH_SESSION_COOKIE,
  AUTH_REFRESH_COOKIE,
  AUTH_BACKEND_ACCESS_COOKIE,
} from "@/lib/auth-cookies";

function toSessionRole(roles: string[] | undefined): UserRole {
  if (roles?.includes("SUPER_ADMIN")) {
    return "admin";
  }

  return "customer";
}

type NestRefreshPayload = {
  data?: {
    user?: {
      id: number;
      email: string;
      roles?: string[];
      fullName: string;
      isBlocked?: boolean;
      accessToken: string;
      refreshToken: string;
    };
  };
  message?: string | string[];
};

/**
 * Exchanges the httpOnly Nest refresh cookie for new tokens. The browser POSTs `{}` with
 * credentials; this handler reads `AUTH_REFRESH_COOKIE` and calls Nest with
 * `JSON.stringify({ refreshToken })` — same body shape as `RefreshTokenDto` on the server.
 */
export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(AUTH_REFRESH_COOKIE)?.value;
  if (!refresh) {
    return jsonMessage("No refresh token", 401);
  }

  const res = await fetch(`${getBackendUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  let payload: NestRefreshPayload | null = null;
  try {
    payload = (await res.json()) as NestRefreshPayload;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const status = res.status === 403 ? 403 : 401;
    if (status === 403) {
      jar.delete(AUTH_SESSION_COOKIE);
      jar.delete(AUTH_BACKEND_ACCESS_COOKIE);
      jar.delete(AUTH_REFRESH_COOKIE);
    }
    return jsonMessage(nestErrorMessage(payload), status);
  }

  const u = payload?.data?.user;
  if (
    !u?.accessToken ||
    !u.refreshToken ||
    u.email === undefined ||
    u.id === undefined
  ) {
    return jsonMessage("Unexpected response from server", 502);
  }

  if (u.isBlocked) {
    jar.delete(AUTH_SESSION_COOKIE);
    jar.delete(AUTH_BACKEND_ACCESS_COOKIE);
    jar.delete(AUTH_REFRESH_COOKIE);
    return jsonMessage(ACCOUNT_BLOCKED_MESSAGE, 403);
  }

  const role = toSessionRole(u.roles);

  const displayName =
    typeof u.fullName === "string" && u.fullName.trim().length > 0
      ? u.fullName.trim()
      : (u.email.split("@")[0] ?? "User");

  const sessionJwt = await signAccessToken({
    sub: String(u.id),
    email: u.email,
    role,
    name: displayName,
    isBlocked: false,
  });

  jar.set(AUTH_SESSION_COOKIE, sessionJwt, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  jar.set(AUTH_BACKEND_ACCESS_COOKIE, u.accessToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  jar.set(AUTH_REFRESH_COOKIE, u.refreshToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });

  const body: ApiResponse<{ accessToken: string; expiresIn: number }> = {
    data: { accessToken: u.accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  };
  return jsonOk(body);
}
