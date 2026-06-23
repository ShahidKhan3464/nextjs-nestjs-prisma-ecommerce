"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { LogOut, User } from "lucide-react";
import { logoutRequest } from "@/modules/auth";
import { useAuthStore } from "@/store/auth-store";
import { buttonVariants } from "@/components/ui/button";
import { resetCartWishlistSession } from "@/lib/cart-wishlist-session";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Props = {
  /** Main heading shown next to brand */
  sectionTitle: string;
  /** Subtle subtitle under section title (optional) */
  sectionHint?: string;
};

export function AppChromeHeader({ sectionTitle, sectionHint }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = React.useState(false);
  const clearSession = useAuthStore((s) => s.clearSession);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      /* ignore */
    }
    clearSession();
    resetCartWishlistSession();
    router.refresh();
    router.push(ROUTES.home);
  }

  return (
    <header className="border-border bg-background/95 sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60 lg:px-6">
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase">
          {siteConfig.name}
        </p>
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="font-heading truncate text-base font-semibold tracking-tight md:text-lg">
            {sectionTitle}
          </h1>
          {sectionHint ? (
            <span className="text-muted-foreground hidden text-xs md:inline">
              {sectionHint}
            </span>
          ) : null}
        </div>
      </div>

      {!mounted ? null : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <User className="size-4 shrink-0" />
            <span className="max-w-[140px] truncate">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-muted-foreground text-xs">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.role === "customer" && (
              <DropdownMenuItem
                onClick={() => {
                  router.push(ROUTES.profile);
                }}
              >
                <User className="mr-2 size-4" /> Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => void logout()}>
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          href={ROUTES.login}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
