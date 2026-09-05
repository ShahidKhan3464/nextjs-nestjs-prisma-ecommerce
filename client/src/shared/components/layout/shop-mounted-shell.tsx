"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import { ShopRoleShell } from "@/shared/components/layout/shop-role-shell";
import { fetchProfile } from "@/modules/customer/profile/services/profile.service";

/** Shared chrome for admin / customer / shared route groups. */
export function ShopMountedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !user || user.roles.length > 0) return;

    let cancelled = false;

    void (async () => {
      try {
        await api.post("/api/v1/auth/refresh", {});
        const profile = await fetchProfile();
        if (cancelled || profile.roles.length === 0) return;
        setUser(profile);
        router.refresh();
      } catch {
        /* ignore — user can sign in again */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, router, setUser, user]);

  if (!mounted) {
    return (
      <div className="bg-background flex min-h-screen">
        <aside className="border-border bg-muted/30 hidden w-56 shrink-0 border-r md:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-border bg-background h-14 border-b" />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    );
  }

  const roles = user?.roles ?? [];
  return <ShopRoleShell roles={roles}>{children}</ShopRoleShell>;
}
