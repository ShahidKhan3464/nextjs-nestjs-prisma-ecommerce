import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  WISHLIST_STORAGE_BASE,
  currentCartWishlistOwnerId,
  createNamespacedStateStorage,
} from "@/lib/cart-wishlist-ownership";

interface WishlistState {
  productIds: string[];
  /** `null` = guest bag (safe to merge on login). A user id means it belongs to that account. */
  ownerUserId: string | null;
  setProductIds: (productIds: string[]) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  resetToGuest: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      ownerUserId: null,
      setProductIds: (productIds) =>
        set({
          productIds,
          ownerUserId: currentCartWishlistOwnerId(),
        }),
      toggle: (productId) => {
        const exists = get().productIds.includes(productId);
        set({
          ownerUserId: currentCartWishlistOwnerId() ?? get().ownerUserId,
          productIds: exists
            ? get().productIds.filter((id) => id !== productId)
            : [...get().productIds, productId],
        });
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () =>
        set({
          productIds: [],
          ownerUserId: currentCartWishlistOwnerId() ?? get().ownerUserId,
        }),
      resetToGuest: () => set({ productIds: [], ownerUserId: null }),
    }),
    {
      name: WISHLIST_STORAGE_BASE,
      storage: createJSONStorage(() =>
        createNamespacedStateStorage(WISHLIST_STORAGE_BASE)
      ),
      partialize: (state) => ({
        productIds: state.productIds,
        ownerUserId: state.ownerUserId,
      }),
      merge: (persisted, current) => {
        const p =
          persisted && typeof persisted === "object"
            ? (persisted as Partial<WishlistState>)
            : {};
        return {
          ...current,
          productIds: Array.isArray(p.productIds)
            ? p.productIds
            : current.productIds,
          ownerUserId: p.ownerUserId === undefined ? null : p.ownerUserId,
        };
      },
    }
  )
);
