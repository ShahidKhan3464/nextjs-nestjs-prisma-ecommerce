import type { ProductValues } from "../schemas";
import type { Product } from "@/modules/customer/products/types";

export const DEFAULT_PRODUCT_VARIANT: ProductValues["variants"][number] = {
  size: "S",
  color: "Black",
  sku: "",
  stock: 5,
  price: 100,
};

export function previewKey(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function sortCategoriesByName<T extends { name: string }>(
  categories: T[]
): T[] {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export function parseCategoryId(value: string): number | null {
  const categoryId = Number(value);
  if (!Number.isFinite(categoryId) || categoryId < 1) return null;
  return categoryId;
}

export function mapFormVariantsToPayload(variants: ProductValues["variants"]) {
  return variants.map((v) => ({
    stock: v.stock,
    price: v.price,
    sku: v.sku.trim(),
    size: v.size.trim(),
    color: v.color.trim(),
  }));
}

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
