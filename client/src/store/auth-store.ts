import { create } from "zustand";
import type { User } from "@/modules/auth";
import { persist } from "zustand/middleware";
import { normalizeRoles } from "@/modules/auth/utils/roles";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** Unix timestamp (ms) when the access token expires. */
  tokenExpiresAt: number | null;
  setUser: (user: User) => void;
  setAccessToken: (accessToken: string, expiresIn?: number) => void;
  setSession: (user: User, accessToken: string, expiresIn?: number) => void;
  clearSession: () => void;
}

/** Migrate persisted sessions from singular `role` to `roles[]`. */
function normalizePersistedUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== "string" || typeof u.email !== "string") return null;

  let roles = normalizeRoles(u.roles);
  if (roles.length === 0 && typeof u.role === "string") {
    if (u.role === "admin" || u.role === "SUPER_ADMIN") {
      roles = ["SUPER_ADMIN"];
    } else if (u.role === "SELLER") {
      roles = ["SELLER"];
    } else {
      roles = ["BUYER"];
    }
  }

  const fullName =
    typeof u.fullName === "string"
      ? u.fullName
      : typeof u.name === "string"
        ? u.name
        : u.email.split("@")[0] ?? "User";

  return {
    roles,
    id: u.id,
    fullName,
    email: u.email,
    name: typeof u.name === "string" ? u.name : fullName,
    createdAt:
      typeof u.createdAt === "string" ? u.createdAt : new Date(0).toISOString(),
    isBlocked: typeof u.isBlocked === "boolean" ? u.isBlocked : false,
    avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : undefined,
    phoneNumber:
      typeof u.phoneNumber === "string" ? u.phoneNumber : undefined,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      tokenExpiresAt: null,
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken, expiresIn) =>
        set({
          accessToken,
          tokenExpiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
        }),
      setSession: (user, accessToken, expiresIn) =>
        set({
          user,
          accessToken,
          tokenExpiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
        }),
      clearSession: () =>
        set({ user: null, accessToken: null, tokenExpiresAt: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Persist identity only — Nest access JWT stays memory + httpOnly cookie.
        user: state.user,
      }),
      merge: (persisted, current) => {
        const p =
          persisted && typeof persisted === "object"
            ? (persisted as Partial<AuthState>)
            : {};
        return {
          ...current,
          user: normalizePersistedUser(p.user) ?? null,
          // Never hydrate access tokens from localStorage (XSS blast radius).
          accessToken: null,
          tokenExpiresAt: null,
        };
      },
    }
  )
);

/** Returns true if the stored access token is expired or about to expire (within 30s buffer). */
export function isTokenExpired(): boolean {
  const { accessToken, tokenExpiresAt } = useAuthStore.getState();
  if (!accessToken) return false; // no token at all — nothing to refresh
  if (!tokenExpiresAt) return true; // token exists but no expiry info — treat as expired
  return Date.now() >= tokenExpiresAt - 30_000;
}
