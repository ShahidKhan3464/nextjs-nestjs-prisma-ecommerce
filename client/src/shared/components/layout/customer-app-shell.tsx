"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { usePathname } from "next/navigation";
import { useAppSectionMeta } from "@/shared/hooks/use-app-section-meta";
import { AppChromeHeader } from "@/shared/components/layout/app-chrome-header";
import {
  Heart,
  Store,
  Package,
  UserRound,
  ShoppingBag,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";

const nav = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.products, label: "Products", icon: ShoppingBag },
  { href: ROUTES.cart, label: "Cart", icon: ShoppingCart },
  { href: ROUTES.wishlist, label: "Wishlist", icon: Heart },
  { href: ROUTES.orders, label: "Orders", icon: Package },
  { href: ROUTES.profile, label: "Profile", icon: UserRound },
];

export function CustomerAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = useAppSectionMeta();

  return (
    <div className="bg-background flex min-h-screen">
      <aside
        id="customer-sidebar"
        className="border-border bg-muted/30 sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r md:flex"
        aria-label="Customer navigation"
      >
        <div className="border-border flex h-14 items-center gap-2 border-b px-4">
          <div className="bg-primary flex size-6 items-center justify-center rounded-md">
            <Store className="text-primary-foreground size-4" />
          </div>
          <span className="font-heading font-semibold tracking-tight">
            My Account
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active =
              item.href === ROUTES.dashboard
                ? pathname === ROUTES.dashboard
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
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
        <AppChromeHeader sectionHint={meta.hint} sectionTitle={meta.title} />
        <div id="main-content" className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </div>

      <nav
        className="border-border bg-background fixed right-0 bottom-0 left-0 z-40 flex border-t px-2 py-2 md:hidden"
        aria-label="Mobile customer navigation"
      >
        {nav.map((item) => {
          const active =
            item.href === ROUTES.dashboard
              ? pathname === ROUTES.dashboard
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-[10px]",
                active ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
