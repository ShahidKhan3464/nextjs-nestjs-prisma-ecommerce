import { useCartStore } from "@/store/cart-store";
import { queryKeys } from "@/constants/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCart } from "@/modules/buyer/cart/services/cart.service";
import { isAuthenticatedForCartWishlist } from "@/lib/cart-wishlist-session";

/**
 * Invalidate buyer caches after a successful multi-vendor checkout.
 * Forces a cart re-fetch so navbar counts stay in sync without a full reload.
 */
export function useInvalidateAfterCheckout() {
  const qc = useQueryClient();

  return async function invalidateAfterCheckout() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
      qc.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
      qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.buyer }),
      (async () => {
        if (!isAuthenticatedForCartWishlist()) {
          useCartStore.getState().clear();
          return;
        }
        try {
          const items = await fetchCart();
          useCartStore.getState().setItems(items);
        } catch {
          useCartStore.getState().clear();
        }
      })(),
    ]);
  };
}
