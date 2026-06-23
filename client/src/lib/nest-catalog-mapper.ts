import { slugify } from "@/lib/slugify";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import type { Product, ProductVariant } from "@/types";

/** Backend product shape (relations loaded). Keep loose to track API drift. */
export type NestProductDto = {
  id: number;
  name: string;
  status?: string;
  deletedAt?: string | null;
  description?: string | null;
  variants?: NestVariantDto[];
  images?: NestProductImageDto[];
  category?: { id: number; name: string };
};

type NestProductImageDto = {
  id: number;
  urlPath: string;
  sortOrder: number;
};

type NestVariantDto = {
  id: number;
  sku: string;
  size: string;
  color: string;
  stock: number;
  price: string | number;
};

export function mapNestProductToAdminProduct(p: NestProductDto): Product {
  const rawImages = (p.images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => resolveUploadUrl(img.urlPath))
    .filter((url): url is string => Boolean(url));
  const images = rawImages.length > 0 ? rawImages : ["/placeholder.svg"];

  const variants: ProductVariant[] = (p.variants ?? []).map((v) => ({
    id: String(v.id),
    productId: String(p.id),
    sku: v.sku,
    name: `${v.size} / ${v.color}`,
    options: { size: v.size, color: v.color },
    price: Number(v.price),
    stock: v.stock,
  }));

  const basePrice =
    variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0;

  return {
    id: String(p.id),
    slug: `${slugify(p.name)}-${p.id}`,
    name: p.name,
    description: p.description ?? "",
    category: p.category?.name ?? "",
    images,
    variants,
    basePrice,
    isRemoved: Boolean(p.deletedAt),
  };
}
