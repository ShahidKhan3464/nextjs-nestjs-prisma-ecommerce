import { create } from "zustand";
import type { CartItem } from "@/modules/buyer/cart/types";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CART_STORAGE_BASE,
  currentCartWishlistOwnerId,
  createNamespacedStateStorage,
} from "@/lib/cart-wishlist-ownership";

export interface CartState {
  items: CartItem[];
  /** `null` = guest bag (safe to merge on login). A user id means it belongs to that account. */
  ownerUserId: string | null;
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, quantity: number) => void;
  clear: () => void;
  resetToGuest: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerUserId: null,
      setItems: (items) =>
        set({ items, ownerUserId: currentCartWishlistOwnerId() }),
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.variantId === item.variantId
        );
        const ownerUserId = currentCartWishlistOwnerId() ?? get().ownerUserId;
        if (existing) {
          const qty = Math.min(
            existing.quantity + item.quantity,
            existing.maxQty
          );
          set({
            ownerUserId,
            items: get().items.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: qty } : i
            ),
          });
        } else {
          set({ items: [...get().items, item], ownerUserId });
        }
      },
      updateQty: (variantId, quantity) => {
        const ownerUserId = currentCartWishlistOwnerId() ?? get().ownerUserId;
        if (quantity <= 0) {
          set({
            ownerUserId,
            items: get().items.filter((i) => i.variantId !== variantId),
          });
          return;
        }
        set({
          ownerUserId,
          items: get().items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, i.maxQty) }
              : i
          ),
        });
      },
      removeItem: (variantId) =>
        set({
          ownerUserId: currentCartWishlistOwnerId() ?? get().ownerUserId,
          items: get().items.filter((i) => i.variantId !== variantId),
        }),
      clear: () =>
        set({
          items: [],
          ownerUserId: currentCartWishlistOwnerId() ?? get().ownerUserId,
        }),
      resetToGuest: () => set({ items: [], ownerUserId: null }),
    }),
    {
      name: CART_STORAGE_BASE,
      storage: createJSONStorage(() =>
        createNamespacedStateStorage(CART_STORAGE_BASE)
      ),
      partialize: (state) => ({
        items: state.items,
        ownerUserId: state.ownerUserId,
      }),
      merge: (persisted, current) => {
        const p =
          persisted && typeof persisted === "object"
            ? (persisted as Partial<CartState>)
            : {};
        return {
          ...current,
          items: Array.isArray(p.items) ? p.items : current.items,
          ownerUserId: p.ownerUserId === undefined ? null : p.ownerUserId,
        };
      },
    }
  )
);
