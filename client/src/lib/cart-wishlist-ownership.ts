import { useAuthStore } from "@/store/auth-store";

export const CART_STORAGE_BASE = "cart-storage";
export const WISHLIST_STORAGE_BASE = "wishlist-storage";

export function namespacedCartWishlistKey(
  base: string,
  userId: string | null
): string {
  return userId ? `${base}:user:${userId}` : `${base}:guest`;
}

export function currentCartWishlistOwnerId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

/** Guest bags are owned by nobody (`null`). Any other id belongs to an account. */
export function shouldMergeLocalCartWishlistOnLogin(params: {
  currentUserId: string;
  ownerUserId: string | null;
}): boolean {
  if (params.ownerUserId === params.currentUserId) return false;
  if (params.ownerUserId != null) return false;
  return true;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
}

export function createNamespacedStateStorage(base: string): {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
} {
  return {
    getItem: () => {
      const ls = getLocalStorage();
      if (!ls) return null;
      const uid = currentCartWishlistOwnerId();
      return (
        ls.getItem(namespacedCartWishlistKey(base, uid)) ?? ls.getItem(base)
      );
    },
    setItem: (_name, value) => {
      const ls = getLocalStorage();
      if (!ls) return;
      const uid = currentCartWishlistOwnerId();
      const key = namespacedCartWishlistKey(base, uid);
      ls.setItem(key, value);
      if (uid) {
        ls.removeItem(base);
        ls.removeItem(namespacedCartWishlistKey(base, null));
      } else {
        ls.setItem(base, value);
      }
    },
    removeItem: () => {
      const ls = getLocalStorage();
      if (!ls) return;
      const uid = currentCartWishlistOwnerId();
      ls.removeItem(namespacedCartWishlistKey(base, uid));
      ls.removeItem(base);
      if (uid) {
        ls.removeItem(namespacedCartWishlistKey(base, null));
      }
    },
  };
}

/** Drop shared/guest keys so the next visitor cannot inherit a previous bag. */
export function wipeSharedCartWishlistStorage(): void {
  const ls = getLocalStorage();
  if (!ls) return;
  for (const base of [CART_STORAGE_BASE, WISHLIST_STORAGE_BASE]) {
    ls.removeItem(base);
    ls.removeItem(namespacedCartWishlistKey(base, null));
  }
}

/** Delete that account's namespaced cart/wishlist keys (not emptied blobs). */
export function removeUserCartWishlistStorage(userId: string | null): void {
  if (!userId) return;
  const ls = getLocalStorage();
  if (!ls) return;
  ls.removeItem(namespacedCartWishlistKey(CART_STORAGE_BASE, userId));
  ls.removeItem(namespacedCartWishlistKey(WISHLIST_STORAGE_BASE, userId));
}
