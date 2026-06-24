"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { hydrateCartOnce } from "@/lib/cart-wishlist-session";

/** Fetches cart once per session (cart / checkout pages only). */
export function useCartHydrate() {
  const accessToken = useAuthStore((s) => s.accessToken);

  React.useEffect(() => {
    if (!accessToken) return;
    void hydrateCartOnce().catch(() => undefined);
  }, [accessToken]);
}
