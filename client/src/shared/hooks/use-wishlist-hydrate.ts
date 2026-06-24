"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { hydrateWishlistOnce } from "@/lib/cart-wishlist-session";

/** Fetches wishlist once per session (for heart icons on product grids). */
export function useWishlistHydrate() {
  const accessToken = useAuthStore((s) => s.accessToken);

  React.useEffect(() => {
    if (!accessToken) return;
    void hydrateWishlistOnce().catch(() => undefined);
  }, [accessToken]);
}
