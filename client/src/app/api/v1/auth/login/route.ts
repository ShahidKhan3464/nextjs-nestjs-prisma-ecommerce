import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/backend-url";
import { signAccessToken } from "@/lib/server-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { ApiResponse, User, UserRole } from "@/types";
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

/** Nest wraps controller return values with DataResponseInterceptor: `{ data, version }`. */
type NestLoginPayload = {
  data?: {
    user?: {
      id: number;
      roles?: string[];
      email: string;
      fullName: string;
      isBlocked: boolean;
      accessToken: string;
      refreshToken: string;
    };
  };
  statusCode?: number;
  message?: string | string[];
};

function nestErrorMessage(payload: NestLoginPayload | null): string {
  const raw = payload?.message;
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string") return raw;
  return "Invalid email or password";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { email?: unknown }).email !== "string" ||
    typeof (body as { password?: unknown }).password !== "string"
  ) {
    return jsonMessage("Invalid credentials payload", 422);
  }

  const { email, password } = body as { email: string; password: string };

  const res = await fetch(`${getBackendUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let payload: NestLoginPayload | null = null;
  try {
    payload = (await res.json()) as NestLoginPayload;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const status =
      res.status === 401 ? 401 : res.status === 403 ? 403 : res.status;
    return jsonMessage(nestErrorMessage(payload), status);
  }

  const u = payload?.data?.user;
  if (
    !u?.accessToken ||
    !u.refreshToken ||
    u.email === undefined ||
    u.fullName === undefined ||
    u.id === undefined
  ) {
    return jsonMessage("Unexpected response from server", 502);
  }

  if (u.isBlocked) {
    return jsonMessage(ACCOUNT_BLOCKED_MESSAGE, 403);
  }

  const role = toSessionRole(u.roles);

  const sessionJwt = await signAccessToken({
    role,
    email: u.email,
    name: u.fullName,
    sub: String(u.id),
    isBlocked: false,
  });

  const jar = await cookies();
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

  const user: User = {
    role,
    email: u.email,
    name: u.fullName,
    id: String(u.id),
    fullName: u.fullName,
    isBlocked: u.isBlocked,
    createdAt: new Date().toISOString(),
  };

  const response: ApiResponse<{
    user: User;
    accessToken: string;
    expiresIn: number;
  }> = {
    data: {
      user,
      accessToken: u.accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  };

  return jsonOk(response);
}
