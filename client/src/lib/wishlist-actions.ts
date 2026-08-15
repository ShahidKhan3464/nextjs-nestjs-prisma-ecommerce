import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";
import { useWishlistStore } from "@/store/wishlist-store";
import { isAuthenticatedForCartWishlist } from "@/lib/cart-wishlist-session";
import { toggleWishlistItem } from "@/modules/buyer/wishlist/services/wishlist.service";

export async function wishlistToggle(productId: string): Promise<void> {
  const prev = useWishlistStore.getState().productIds;
  const wasWishlisted = prev.includes(productId);
  useWishlistStore.getState().toggle(productId);

  if (!isAuthenticatedForCartWishlist()) {
    if (!wasWishlisted) {
      toast.success("Added to wishlist");
    } else {
      toast.success("Removed from wishlist");
    }
    return;
  }

  try {
    const { productIds } = await toggleWishlistItem(productId);
    const nextIds = productIds.map(String);
    useWishlistStore.getState().setProductIds(nextIds);
    const isWishlisted = nextIds.includes(productId);
    toast.success(isWishlisted ? "Added to wishlist" : "Removed from wishlist");
  } catch (error) {
    useWishlistStore.getState().setProductIds(prev);
    toast.error(getApiErrorMessage(error, "Could not update wishlist"));
  }
}
