"use client";

import * as React from "react";
import { SiteFooter } from "@/shared/components/layout/site-footer";
import { SiteHeader } from "@/shared/components/layout/site-header";

type SiteShellProps = {
  children: React.ReactNode;
  showFooter?: boolean;
};

export function SiteShell({ children, showFooter = true }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {showFooter ? <SiteFooter /> : null}
    </div>
  );
}
