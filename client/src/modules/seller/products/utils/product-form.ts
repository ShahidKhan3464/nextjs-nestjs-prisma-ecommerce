import type { ProductValues } from "../schemas";
import type { SellerProduct, SellerProductImage } from "../types";

export {
  previewKey,
  parseCategoryId,
  sortCategoriesByName,
  mapFormVariantsToPayload,
  DEFAULT_PRODUCT_VARIANT,
} from "@/shared/utils/product-form";

export function mapProductVariantsToFormValues(
  variants: SellerProduct["variants"]
): ProductValues["variants"] {
  return variants.map((v) => ({
    size: v.size,
    color: v.color,
    sku: v.sku,
    stock: v.stock,
    price: v.price,
  }));
}

export function mapProductImagesToRetainPaths(
  images: SellerProductImage[]
): string[] {
  return images
    .map((img) => img.urlPath)
    .filter((path) => path && path !== "/placeholder.svg");
}
