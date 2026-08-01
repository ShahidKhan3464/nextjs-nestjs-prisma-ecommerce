import type { ProductValues } from "../schemas";
import type { SellerProduct, SellerProductImage } from "../types";

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
