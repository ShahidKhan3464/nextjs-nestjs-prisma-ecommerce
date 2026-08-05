import type { ProductValues } from "../schemas";
import type { Product } from "@/modules/customer/products/types";

export {
  previewKey,
  parseCategoryId,
  sortCategoriesByName,
  mapFormVariantsToPayload,
  DEFAULT_PRODUCT_VARIANT,
} from "@/shared/utils/product-form";

export function mapProductVariantsToFormValues(
  variants: Product["variants"]
): ProductValues["variants"] {
  return variants.map((v) => ({
    size: v.options?.size ?? "",
    color: v.options?.color ?? "",
    sku: v.sku,
    stock: v.stock,
    price: v.price,
  }));
}

/** Map public image URL to Nest `urlPath` (e.g. `/uploads/products/...`). */
function imageUrlToRetainPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

export function mapProductImagesToRetainPaths(images: string[]): string[] {
  return images.map(imageUrlToRetainPath);
}
