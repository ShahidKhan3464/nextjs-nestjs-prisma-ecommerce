import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/modules/auth";
import { normalizeRoles } from "@/modules/auth/utils/roles";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/auth-token-durations";

function resolveJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET must be set in production (min 32 characters)."
      );
    }
    return new TextEncoder().encode(
      "dev-only-change-in-production-min-32-chars!!"
    );
  }
  if (process.env.NODE_ENV === "production" && raw.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production.");
  }
  return new TextEncoder().encode(raw);
}

const secret = resolveJwtSecret();

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  typ: "access" | "refresh";
  /** Session tokens may carry display name from Nest login/refresh. */
  name?: string;
  fullName?: string;
  isBlocked?: boolean;
}

export async function signAccessToken(payload: Omit<JwtPayload, "typ">) {
  const token = await new SignJWT({ ...payload, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secret);
  return token;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const rawSub = payload.sub;
    const sub =
      typeof rawSub === "string"
        ? rawSub
        : typeof rawSub === "number"
          ? String(rawSub)
          : null;
    if (!sub) return null;

    const email = typeof payload.email === "string" ? payload.email : "";

    const roles = normalizeRoles(payload.roles);

    const typ =
      payload.typ === "access" || payload.typ === "refresh"
        ? payload.typ
        : "access";

    const nameRaw = payload.name;
    const name =
      typeof nameRaw === "string" && nameRaw.trim().length > 0
        ? nameRaw.trim()
        : undefined;

    const fullNameRaw = payload.fullName;
    const fullName = typeof fullNameRaw === "string" ? fullNameRaw : undefined;

    const isBlocked =
      typeof payload.isBlocked === "boolean" ? payload.isBlocked : false;

    return { sub, email, roles, typ, name, fullName, isBlocked };
  } catch {
    return null;
  }
}
