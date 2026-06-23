import { create } from "zustand";
import type { User } from "@/modules/auth";
import { persist } from "zustand/middleware";

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
        user: state.user,
        accessToken: state.accessToken,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
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
