"use client";

import * as React from "react";
import { api } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import { handlePossibleBlockedApiError } from "@/lib/account-blocked";

/** Periodically hits an authenticated API so blocked users are signed out promptly. */
export function BlockedSessionGuard() {
  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function verifyActiveSession() {
      try {
        await api.get("/api/v1/auth/session");
      } catch (error) {
        if (!cancelled) {
          handlePossibleBlockedApiError(error);
        }
      }
    }

    void verifyActiveSession();
    const id = window.setInterval(() => {
      void verifyActiveSession();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user]);

  return null;
}
