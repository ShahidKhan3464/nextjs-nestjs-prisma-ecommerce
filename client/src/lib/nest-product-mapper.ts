import { slugify } from "@/lib/slugify";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import { formatVariantNameFromNest } from "@/modules/customer/products/utils/variant-label";
import type {
  Product,
  ProductStore,
  ProductStoreSeller,
} from "@/modules/customer/products/types";

export type NestProductStorePayload = {
  id: number;
  name: string;
  slug: string;
  status: string;
  logoUrl?: string | null;
  verifiedAt?: string | Date | null;
  sellerProfile?: {
    id: number;
    status: string;
    businessName: string;
  } | null;
};

export type NestProductPayload = {
  id: number;
  name: string;
  status?: string;
  slug: string | null;
  description: string;
  basePrice: string | number;
  publishedAt?: string | Date | null;
  store?: NestProductStorePayload | null;
  category?: {
    id: number;
    name: string;
  };
  categoryId?: number;
  averageRating?: number | null;
  reviewCount?: number | null;
  variants: {
    sku: string;
    size?: string;
    stock?: number;
    color?: string;
    id: number | string;
    stockQuantity?: number;
    price: string | number;
  }[];
  images: string[] | { id: number; urlPath: string; sortOrder?: number }[];
};

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

function mapStore(store: NestProductStorePayload | null | undefined): ProductStore | undefined {
  if (!store || typeof store.name !== "string" || typeof store.slug !== "string") {
    return undefined;
  }

  const seller: ProductStoreSeller | undefined =
    store.sellerProfile &&
    typeof store.sellerProfile.businessName === "string"
      ? {
          id: store.sellerProfile.id,
          businessName: store.sellerProfile.businessName,
          status: store.sellerProfile.status,
        }
      : undefined;

  return {
    name: store.name,
    slug: store.slug,
    id: String(store.id),
    status: store.status,
    verified: store.verifiedAt != null,
    logoUrl: resolveUploadUrl(store.logoUrl) ?? null,
    ...(seller ? { seller } : {}),
  };
}

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
  const store = mapStore(p.store);

  const variants = (p.variants ?? []).map((v) => ({
    sku: v.sku,
    id: String(v.id),
    price: Number(v.price),
    productId: String(p.id),
    name: formatVariantNameFromNest(v),
    stock: Number(v.stockQuantity ?? v.stock ?? 0),
    options: {
      ...(v.size ? { size: v.size } : {}),
      ...(v.color ? { color: v.color } : {}),
    },
  }));

  const categoryId = p.category?.id ?? p.categoryId;
  const averageRating =
    p.averageRating != null ? Number(p.averageRating) : undefined;
  const reviewCount =
    p.reviewCount != null ? Number(p.reviewCount) : undefined;

  return {
    slug,
    images,
    variants,
    name: p.name,
    id: String(p.id),
    basePrice: Number(p.basePrice),
    description: p.description ?? "",
    category: p.category?.name ?? "",
    ...(categoryId != null ? { categoryId: Number(categoryId) } : {}),
    publishedAt: toIsoOrNull(p.publishedAt),
    ...(store ? { store } : {}),
    ...(averageRating != null && !Number.isNaN(averageRating)
      ? { averageRating }
      : {}),
    ...(reviewCount != null && !Number.isNaN(reviewCount)
      ? { reviewCount }
      : {}),
  };
}
