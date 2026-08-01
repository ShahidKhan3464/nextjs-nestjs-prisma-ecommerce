import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import {
  PRODUCT_STATUSES,
  type ProductStatus,
  type SellerProduct,
  type SellerProductImage,
  type SellerProductVariant,
} from "@/modules/seller/products/types";

export type NestSellerProductDto = {
  id: number;
  name: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: number;
  slug?: string | null;
  deletedAt?: string | null;
  basePrice?: number | string;
  publishedAt?: string | null;
  description?: string | null;
  images?: NestSellerProductImageDto[];
  variants?: NestSellerProductVariantDto[];
  category?: { id: number; name: string } | null;
};

type NestSellerProductImageDto = {
  id: number;
  urlPath: string;
  mimeType?: string;
  fileSize?: number;
  createdAt?: string;
  originalName?: string;
};

type NestSellerProductVariantDto = {
  id: number;
  sku: string;
  size: string;
  color: string;
  price: number | string;
  stockQuantity?: number;
  stock?: number;
};

function parseStatus(value: unknown): ProductStatus {
  if (typeof value === "string" && (PRODUCT_STATUSES as readonly string[]).includes(value)) {
    return value as ProductStatus;
  }
  return "DRAFT";
}

function mapImages(
  images: NestSellerProductImageDto[] | undefined
): SellerProductImage[] {
  return (images ?? [])
    .map((img) => {
      const url = resolveUploadUrl(img.urlPath);
      if (!url) return null;
      return {
        id: img.id,
        url,
        urlPath: img.urlPath,
      };
    })
    .filter((img): img is SellerProductImage => img !== null);
}

function mapVariants(
  productId: number,
  variants: NestSellerProductVariantDto[] | undefined
): SellerProductVariant[] {
  return (variants ?? []).map((v) => ({
    sku: v.sku,
    size: v.size,
    color: v.color,
    id: String(v.id),
    price: Number(v.price),
    productId: String(productId),
    stock: v.stockQuantity ?? v.stock ?? 0,
  }));
}

export function mapNestSellerProduct(p: NestSellerProductDto): SellerProduct {
  const images = mapImages(p.images);
  const variants = mapVariants(p.id, p.variants);
  const basePrice =
    p.basePrice !== undefined && p.basePrice !== null
      ? Number(p.basePrice)
      : variants.length > 0
        ? Math.min(...variants.map((v) => v.price))
        : 0;

  return {
    variants,
    name: p.name,
    id: String(p.id),
    slug: p.slug ?? null,
    status: parseStatus(p.status),
    isRemoved: Boolean(p.deletedAt),
    description: p.description ?? "",
    category: p.category?.name ?? "",
    publishedAt: p.publishedAt ?? null,
    categoryId: p.categoryId ?? p.category?.id ?? 0,
    createdAt: p.createdAt ?? new Date(0).toISOString(),
    updatedAt: p.updatedAt ?? new Date(0).toISOString(),
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    images:
      images.length > 0
        ? images
        : [{ id: 0, url: "/placeholder.svg", urlPath: "/placeholder.svg" }],

  };
}
