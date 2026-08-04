import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { fetchCart } from "@/modules/customer/cart/services/cart.service";
import { fetchWishlist } from "@/modules/customer/wishlist/services/wishlist.service";

export function isAuthenticatedForCartWishlist(): boolean {
  return Boolean(useAuthStore.getState().accessToken);
}

let sessionUserId: string | null = null;
let cartLoadedForSession = false;
let wishlistLoadedForSession = false;
let cartHydrateInFlight: Promise<void> | null = null;
let wishlistHydrateInFlight: Promise<void> | null = null;

export function resetCartWishlistSession(): void {
  sessionUserId = null;
  cartLoadedForSession = false;
  wishlistLoadedForSession = false;
  cartHydrateInFlight = null;
  wishlistHydrateInFlight = null;
}

/** Called after login sync so we do not re-fetch on the next page. */
export function markCartWishlistSessionHydrated(): void {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  sessionUserId = userId;
  cartLoadedForSession = true;
  wishlistLoadedForSession = true;
}

function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function resetIfUserChanged(): void {
  const uid = currentUserId();
  if (uid && sessionUserId && uid !== sessionUserId) {
    resetCartWishlistSession();
  }
}

/** Load cart from API once per signed-in session (cart / checkout pages). */
export async function hydrateCartOnce(): Promise<void> {
  if (!isAuthenticatedForCartWishlist()) return;
  resetIfUserChanged();
  const uid = currentUserId();
  if (!uid || (cartLoadedForSession && sessionUserId === uid)) return;

  if (!cartHydrateInFlight) {
    cartHydrateInFlight = (async () => {
      const items = await fetchCart();
      useCartStore.getState().setItems(items);
      cartLoadedForSession = true;
      sessionUserId = uid;
    })().finally(() => {
      cartHydrateInFlight = null;
    });
  }

  await cartHydrateInFlight;
}

/** Load wishlist IDs once per session (listing, PDP, wishlist page). */
export async function hydrateWishlistOnce(): Promise<void> {
  if (!isAuthenticatedForCartWishlist()) return;
  resetIfUserChanged();
  const uid = currentUserId();
  if (!uid || (wishlistLoadedForSession && sessionUserId === uid)) return;

  if (!wishlistHydrateInFlight) {
    wishlistHydrateInFlight = (async () => {
      const { productIds } = await fetchWishlist();
      useWishlistStore.getState().setProductIds(productIds);
      wishlistLoadedForSession = true;
      sessionUserId = uid;
    })().finally(() => {
      wishlistHydrateInFlight = null;
    });
  }

  await wishlistHydrateInFlight;
}
