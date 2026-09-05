export type ProductVariantFormValues = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
};

export const DEFAULT_PRODUCT_VARIANT: ProductVariantFormValues = {
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

export function mapFormVariantsToPayload(variants: ProductVariantFormValues[]) {
  return variants.map((v) => ({
    stockQuantity: v.stock,
    price: v.price,
    sku: v.sku.trim(),
    size: v.size.trim(),
    color: v.color.trim(),
  }));
}
