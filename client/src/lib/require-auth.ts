import type { User } from "@/types";
import { cookies } from "next/headers";
import { jsonMessage } from "@/lib/api-response";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookies";
import { verifyToken, type JwtPayload } from "@/lib/server-auth";

function userFromSessionPayload(payload: JwtPayload): User {
  return {
    id: payload.sub,
    role: payload.role,
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

export async function requireAdmin(req: Request): Promise<User | Response> {
  const res = await requireUser(req);
  if (res instanceof Response) return res;
  if (res.role !== "admin") {
    return jsonMessage("Forbidden", 403);
  }
  return res;
}
