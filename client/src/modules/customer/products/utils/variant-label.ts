import type { ProductVariant } from "../types";

/** Human-readable variant label (size, color, or SKU). */
export function formatVariantLabel(
  variant: Pick<ProductVariant, "name" | "options" | "sku">
): string {
  const size = variant.options?.size?.trim();
  const color = variant.options?.color?.trim();
  const parts = [size, color].filter(Boolean);
  if (parts.length > 0) return parts.join(" / ");
  const name = variant.name?.trim();
  if (name && name !== variant.sku) return name;
  return variant.sku;
}

export function formatVariantNameFromNest(v: {
  size?: string;
  color?: string;
  sku: string;
}): string {
  const parts = [v.size?.trim(), v.color?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" / ");
  return v.sku;
}

export function uniqueVariantOptionValues(
  variants: ProductVariant[],
  key: "size" | "color"
): string[] {
  const values = variants
    .map((v) => v.options?.[key]?.trim())
    .filter((v): v is string => Boolean(v));
  return [...new Set(values)];
}

export function findVariantByOptions(
  variants: ProductVariant[],
  size?: string,
  color?: string
): ProductVariant | undefined {
  return variants.find((v) => {
    const matchSize = !size || v.options?.size?.trim() === size;
    const matchColor = !color || v.options?.color?.trim() === color;
    return matchSize && matchColor;
  });
}

/** Whether each size+color pair maps to exactly one variant. */
export function hasUniqueVariantOptionMatrix(
  variants: ProductVariant[]
): boolean {
  const keys = variants.map(
    (v) => `${v.options?.size?.trim() ?? ""}|${v.options?.color?.trim() ?? ""}`
  );
  return new Set(keys).size === variants.length;
}

/** First variant for a size, optionally preferring a color. */
export function findVariantForSize(
  variants: ProductVariant[],
  size: string,
  preferColor?: string
): ProductVariant | undefined {
  if (preferColor) {
    const exact = findVariantByOptions(variants, size, preferColor);
    if (exact) return exact;
  }
  return variants.find((v) => v.options?.size?.trim() === size);
}

/** First variant for a color, optionally preferring a size. */
export function findVariantForColor(
  variants: ProductVariant[],
  color: string,
  preferSize?: string
): ProductVariant | undefined {
  if (preferSize) {
    const exact = findVariantByOptions(variants, preferSize, color);
    if (exact) return exact;
  }
  return variants.find((v) => v.options?.color?.trim() === color);
}
