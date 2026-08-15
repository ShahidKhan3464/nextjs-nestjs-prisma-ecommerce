import type { GroupedCart, StoreCartGroup } from "./types";
import type { CartItem } from "@/modules/buyer/cart/types";

export type { StoreCartGroup, GroupedCart } from "./types";

const UNKNOWN_STORE_KEY = "__unknown__";

/** Group cart lines by store. Never merges products across different stores. */
export function groupCartItemsByStore(items: CartItem[]): GroupedCart {
  const map = new Map<string, StoreCartGroup>();

  for (const item of items) {
    const storeKey = item.store?.id ?? UNKNOWN_STORE_KEY;
    const existing = map.get(storeKey);
    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.price * item.quantity;
    } else {
      map.set(storeKey, {
        storeKey,
        store: item.store,
        items: [item],
        subtotal: item.price * item.quantity,
      });
    }
  }

  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    subtotal: Math.round(g.subtotal * 100) / 100,
  }));

  // Stable-ish sort: named stores first alphabetically, unknown last
  groups.sort((a, b) => {
    if (!a.store && b.store) return 1;
    if (a.store && !b.store) return -1;
    return (a.store?.name ?? "").localeCompare(b.store?.name ?? "");
  });

  const grandTotal =
    Math.round(groups.reduce((s, g) => s + g.subtotal, 0) * 100) / 100;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return { groups, grandTotal, itemCount };
}
