import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/modules/buyer/cart/types";

export interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.variantId === item.variantId
        );
        if (existing) {
          const qty = Math.min(
            existing.quantity + item.quantity,
            existing.maxQty
          );
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: qty } : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      updateQty: (variantId, quantity) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter((i) => i.variantId !== variantId),
          });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, i.maxQty) }
              : i
          ),
        });
      },
      removeItem: (variantId) =>
        set({
          items: get().items.filter((i) => i.variantId !== variantId),
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "cart-storage" }
  )
);
