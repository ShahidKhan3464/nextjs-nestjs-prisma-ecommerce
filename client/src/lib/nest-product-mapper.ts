import { slugify } from "@/lib/slugify";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import type { Product } from "@/modules/customer/products/types";
import { formatVariantNameFromNest } from "@/modules/customer/products/lib/variant-label";

export type NestProductPayload = {
  id: number;
  name: string;
  status?: string;
  slug: string | null;
  description: string;
  basePrice: string | number;
  category?: {
    id: number;
    name: string;
  };
  categoryId?: number;
  variants: {
    sku: string;
    size?: string;
    stock: number;
    color?: string;
    id: number | string;
    price: string | number;
  }[];
  images: string[] | { id: number; urlPath: string; sortOrder?: number }[];
};

export function normalizeNestProductPayload(p: NestProductPayload): Product {
  const images: string[] = (p.images ?? [])
    .map((img) => {
      if (typeof img === "string") return resolveUploadUrl(img) ?? img;
      if (img && typeof img === "object" && "urlPath" in img && img.urlPath) {
        return resolveUploadUrl(img.urlPath) ?? null;
      }
      return null;
    })
    .filter((url): url is string => !!url);

  const slug = p.slug ?? `${slugify(p.name)}-${p.id}`;

  const variants = (p.variants ?? []).map((v) => ({
    sku: v.sku,
    stock: v.stock,
    id: String(v.id),
    price: Number(v.price),
    productId: String(p.id),
    name: formatVariantNameFromNest(v),
    options: {
      ...(v.size ? { size: v.size } : {}),
      ...(v.color ? { color: v.color } : {}),
    },
  }));

  return {
    slug,
    images,
    variants,
    name: p.name,
    id: String(p.id),
    description: p.description,
    basePrice: Number(p.basePrice),
    category: p.category?.name ?? "",
  };
}
