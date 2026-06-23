import { cookies } from "next/headers";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookies";
import { verifyToken, type JwtPayload } from "@/lib/server-auth";

/** Valid access token from cookies, or null. */
export async function getAccessTokenPayload(): Promise<JwtPayload | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.typ !== "access") return null;
  return payload;
}
