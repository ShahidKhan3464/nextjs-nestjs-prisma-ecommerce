"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { ShopRoleShell } from "@/shared/components/layout/shop-role-shell";

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
