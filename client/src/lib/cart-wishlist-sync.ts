import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { shouldMergeLocalCartWishlistOnLogin } from "@/lib/cart-wishlist-ownership";
import {
  syncCart,
  fetchCart,
} from "@/modules/buyer/cart/services/cart.service";
import {
  syncWishlist,
  fetchWishlist,
} from "@/modules/buyer/wishlist/services/wishlist.service";
import {
  isAuthenticatedForCartWishlist,
  markCartWishlistSessionHydrated,
} from "@/lib/cart-wishlist-session";

let syncInFlight: Promise<void> | null = null;

/**
 * Login-only: merge a **guest** local cart/wishlist into the server, then
 * replace Zustand with the server truth. Bags owned by another account are
 * never imported.
 */
export async function syncCartAndWishlistWithServer(): Promise<void> {
  if (!isAuthenticatedForCartWishlist()) return;

  if (syncInFlight) {
    await syncInFlight;
    return;
  }

  syncInFlight = (async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    if (!currentUserId) return;

    const localCart = useCartStore.getState().items;
    const localWishlist = useWishlistStore.getState().productIds;
    const mergeCart = shouldMergeLocalCartWishlistOnLogin({
      currentUserId,
      ownerUserId: useCartStore.getState().ownerUserId,
    });
    const mergeWishlist = shouldMergeLocalCartWishlistOnLogin({
      currentUserId,
      ownerUserId: useWishlistStore.getState().ownerUserId,
    });

    const [serverCart, serverWishlistIds] = await Promise.all([
      mergeCart && localCart.length > 0
        ? syncCart(
            localCart.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
            }))
          )
        : fetchCart(),
      mergeWishlist && localWishlist.length > 0
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
