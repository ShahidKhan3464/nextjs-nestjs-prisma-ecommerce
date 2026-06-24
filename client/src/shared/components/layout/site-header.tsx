"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { Sun, Menu, Moon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <motion.header
      layout
      className="border-border/80 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="font-heading text-base font-semibold tracking-tight"
        >
          {siteConfig.name}
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu className="size-4" />
          </Button>

          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={
              theme === "dark" ? "Activate light mode" : "Activate dark mode"
            }
          >
            <Sun className="dark:hidden size-4" />
            <Moon className="hidden size-4 dark:inline" />
          </Button>

          <Link
            href={ROUTES.login}
            className={cn(
              buttonVariants({ size: "sm", variant: "default" }),
              "hidden sm:inline-flex"
            )}
          >
            Sign in
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-border bg-background md:hidden border-t px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            <Link
              href={ROUTES.login}
              onClick={() => setMobileOpen(false)}
              className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </motion.header>
  );
}
