import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { CartItem } from "@/modules/customer/cart/types";
import {
  hydrateCartOnce,
  isAuthenticatedForCartWishlist,
} from "@/lib/cart-wishlist-session";
import {
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartRemote,
} from "@/modules/customer/cart/services/cart.service";

function replaceCartLine(serverItem: CartItem): void {
  const items = useCartStore.getState().items;
  const without = items.filter((i) => i.variantId !== serverItem.variantId);
  useCartStore.getState().setItems([...without, serverItem]);
}

export async function cartAddItem(item: CartItem): Promise<void> {
  useCartStore.getState().addItem(item);
  if (!isAuthenticatedForCartWishlist()) return;

  try {
    const serverItem = await addCartItem(item.variantId, item.quantity);
    replaceCartLine(serverItem);
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Could not update cart"));
    await hydrateCartOnce().catch(() => undefined);
  }
}

export async function cartUpdateQty(
  variantId: string,
  quantity: number
): Promise<void> {
  useCartStore.getState().updateQty(variantId, quantity);
  if (!isAuthenticatedForCartWishlist()) return;

  try {
    if (quantity <= 0) {
      await removeCartItem(variantId);
      return;
    }
    const serverItem = await updateCartItem(variantId, quantity);
    replaceCartLine(serverItem);
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Could not update cart"));
    await hydrateCartOnce().catch(() => undefined);
  }
}

export async function cartRemoveItem(variantId: string): Promise<void> {
  useCartStore.getState().removeItem(variantId);
  if (!isAuthenticatedForCartWishlist()) return;

  try {
    await removeCartItem(variantId);
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Could not remove item"));
    await hydrateCartOnce().catch(() => undefined);
  }
}

export async function cartClear(): Promise<void> {
  useCartStore.getState().clear();
  if (!isAuthenticatedForCartWishlist()) return;

  try {
    await clearCartRemote();
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Could not clear cart"));
  }
}
