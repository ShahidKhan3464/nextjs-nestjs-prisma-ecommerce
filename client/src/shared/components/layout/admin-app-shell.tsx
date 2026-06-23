"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { usePathname } from "next/navigation";
import { useAppSectionMeta } from "@/shared/hooks/use-app-section-meta";
import { AppChromeHeader } from "@/shared/components/layout/app-chrome-header";
import {
  Store,
  Users,
  Package,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";

const nav = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.users, label: "Users", icon: Users },
  { href: ROUTES.categories, label: "Categories", icon: Store },
  { href: ROUTES.products, label: "Products", icon: Package },
  { href: ROUTES.orders, label: "Orders", icon: ShoppingCart },
];

function adminNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard || pathname === `${ROUTES.dashboard}/`;
  }
  if (href === ROUTES.products) {
    return (
      pathname === ROUTES.products || pathname.startsWith(`${ROUTES.products}/`)
    );
  }
  if (href === ROUTES.categories) {
    return (
      pathname === ROUTES.categories ||
      pathname.startsWith(`${ROUTES.categories}/`)
    );
  }
  if (href === ROUTES.users) {
    return pathname === ROUTES.users || pathname.startsWith(`${ROUTES.users}/`);
  }
  if (href === ROUTES.orders) {
    return (
      pathname === ROUTES.orders || pathname.startsWith(`${ROUTES.orders}/`)
    );
  }
  return false;
}

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = useAppSectionMeta();

  return (
    <div className="bg-background flex min-h-screen">
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className="border-border bg-muted/30 sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r lg:flex"
      >
        <div className="border-border flex h-14 items-center gap-2 border-b px-4">
          <div className="bg-primary flex size-6 items-center justify-center rounded-md">
            <Store className="text-primary-foreground size-4" />
          </div>
          <span className="font-heading font-semibold tracking-tight">
            Admin Portal
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active = adminNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppChromeHeader sectionTitle={meta.title} sectionHint={meta.hint} />
        <div id="main-content" className="flex-1 p-4 py-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
