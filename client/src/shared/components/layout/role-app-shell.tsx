"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Store } from "lucide-react";
import { usePathname } from "next/navigation";
import type { AppNavItem } from "@/shared/navigation/app-nav";
import { isNavItemActive } from "@/shared/navigation/app-nav";
import { useAppSectionMeta } from "@/shared/hooks/use-app-section-meta";
import { AppChromeHeader } from "@/shared/components/layout/app-chrome-header";

type Props = {
  children: React.ReactNode;
  nav: AppNavItem[];
  portalTitle: string;
  sidebarId: string;
  sidebarAriaLabel: string;
  /** Admin chrome uses `lg`; account chrome uses `md`. */
  sidebarVisibleFrom?: "md" | "lg";
  showMobileNav?: boolean;
  mobileAriaLabel?: string;
};

export function RoleAppShell({
  nav,
  children,
  sidebarId,
  portalTitle,
  sidebarAriaLabel,
  showMobileNav = false,
  sidebarVisibleFrom = "md",
  mobileAriaLabel = "Mobile navigation",
}: Props) {
  const pathname = usePathname();
  const meta = useAppSectionMeta();

  const sidebarVisibility =
    sidebarVisibleFrom === "lg" ? "hidden lg:flex" : "hidden md:flex";
  const mobileNavVisibility =
    sidebarVisibleFrom === "lg" ? "lg:hidden" : "md:hidden";
  const mainBottomPad =
    showMobileNav
      ? sidebarVisibleFrom === "lg"
        ? "pb-20 lg:pb-0"
        : "pb-20 md:pb-0"
      : undefined;

  return (
    <div className="bg-background flex min-h-screen">
      <aside
        id={sidebarId}
        aria-label={sidebarAriaLabel}
        className={cn(
          "border-border bg-muted/30 sticky top-0 h-screen w-56 shrink-0 flex-col border-r",
          sidebarVisibility
        )}
      >
        <div className="border-border flex h-14 items-center gap-2 border-b px-4">
          <div className="bg-primary flex size-6 items-center justify-center rounded-md">
            <Store className="text-primary-foreground size-4" />
          </div>
          <span className="font-heading font-semibold tracking-tight">
            {portalTitle}
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 ? (
                  <span className="bg-primary text-primary-foreground ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppChromeHeader sectionTitle={meta.title} sectionHint={meta.hint} />
        <div
          id="main-content"
          className={cn("flex-1 p-4 lg:p-6", mainBottomPad)}
        >
          {children}
        </div>
      </div>

      {showMobileNav ? (
        <nav
          className={cn(
            "border-border bg-background fixed right-0 bottom-0 left-0 z-40 flex border-t px-2 py-2",
            mobileNavVisibility
          )}
          aria-label={mobileAriaLabel}
        >
          {nav.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-[10px]",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
