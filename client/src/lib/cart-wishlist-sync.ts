import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import {
  syncCart,
  fetchCart,
} from "@/modules/customer/cart/services/cart.service";
import {
  syncWishlist,
  fetchWishlist,
} from "@/modules/customer/wishlist/services/wishlist.service";
import {
  isAuthenticatedForCartWishlist,
  markCartWishlistSessionHydrated,
} from "@/lib/cart-wishlist-session";

let syncInFlight: Promise<void> | null = null;

/**
 * Login-only: merge persisted local cart/wishlist into the server, then
 * replace Zustand with the server truth. Avoids duplicate GETs when sync
 * already returns the full list.
 */
export async function syncCartAndWishlistWithServer(): Promise<void> {
  if (!isAuthenticatedForCartWishlist()) return;

  if (syncInFlight) {
    await syncInFlight;
    return;
  }

  syncInFlight = (async () => {
    const localCart = useCartStore.getState().items;
    const localWishlist = useWishlistStore.getState().productIds;

    const [serverCart, serverWishlistIds] = await Promise.all([
      localCart.length > 0
        ? syncCart(
            localCart.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
            }))
          )
        : fetchCart(),
      localWishlist.length > 0
        ? syncWishlist(localWishlist)
        : fetchWishlist().then((w) => w.productIds),
    ]);

    useCartStore.getState().setItems(serverCart);
    useWishlistStore.getState().setProductIds(serverWishlistIds);
    markCartWishlistSessionHydrated();
  })();

  try {
    await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}
