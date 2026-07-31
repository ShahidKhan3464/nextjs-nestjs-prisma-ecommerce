import type { User } from "@/types";
import { cookies } from "next/headers";
import { jsonMessage } from "@/lib/api-response";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookies";
import { verifyToken, type JwtPayload } from "@/lib/server-auth";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

function userFromSessionPayload(payload: JwtPayload): User {
  return {
    id: payload.sub,
    roles: payload.roles,
    email: payload.email,
    createdAt: new Date().toISOString(),
    isBlocked: payload.isBlocked ?? false,
    name:
      payload.name ?? payload.fullName ?? payload.email.split("@")[0] ?? "User",
    fullName:
      payload.fullName ?? payload.name ?? payload.email.split("@")[0] ?? "User",
  };
}

export async function requireUser(req: Request): Promise<User | Response> {
  void req;
  const jar = await cookies();
  const session = jar.get(AUTH_SESSION_COOKIE)?.value;
  if (!session) {
    return jsonMessage("Unauthorized", 401);
  }
  const payload = await verifyToken(session);
  if (!payload || payload.typ !== "access") {
    return jsonMessage("Unauthorized", 401);
  }
  return userFromSessionPayload(payload);
}

/** Requires an authenticated session with the `SUPER_ADMIN` role. */
export async function requireAdmin(req: Request): Promise<User | Response> {
  const res = await requireUser(req);
  if (res instanceof Response) return res;
  if (!isSuperAdmin(res.roles)) {
    return jsonMessage("Forbidden", 403);
  }
  return res;
}

/** Alias for `requireAdmin` — prefers the multi-vendor role name. */
export async function requireSuperAdmin(
  req: Request
): Promise<User | Response> {
  return requireAdmin(req);
}

/** Requires an authenticated session with the `SELLER` role. */
export async function requireSeller(req: Request): Promise<User | Response> {
  const res = await requireUser(req);
  if (res instanceof Response) return res;
  if (!isSeller(res.roles)) {
    return jsonMessage("Forbidden", 403);
  }
  return res;
}
