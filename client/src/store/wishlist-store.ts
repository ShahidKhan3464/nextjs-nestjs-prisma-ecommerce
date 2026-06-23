import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  setProductIds: (productIds: string[]) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      setProductIds: (productIds) => set({ productIds }),
      toggle: (productId) => {
        const exists = get().productIds.includes(productId);
        set({
          productIds: exists
            ? get().productIds.filter((id) => id !== productId)
            : [...get().productIds, productId],
        });
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    { name: "wishlist-storage" }
  )
);
