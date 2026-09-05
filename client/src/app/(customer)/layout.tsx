"use client";

import { ShopMountedShell } from "@/shared/components/layout/shop-mounted-shell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShopMountedShell>{children}</ShopMountedShell>;
}
