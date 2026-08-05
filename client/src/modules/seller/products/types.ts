export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_LIFE_CYCLES = ["active", "removed", "all"] as const;
export type ProductLifeCycle = (typeof PRODUCT_LIFE_CYCLES)[number];

export type SellerProductImage = {
  id: number;
  url: string;
  /** Nest storage path used with `retainImagePaths`. */
  urlPath: string;
};

export type SellerProductVariant = {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
};

export type SellerProduct = {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  status: ProductStatus;
  categoryId: number;
  category: string;
  basePrice: number;
  images: SellerProductImage[];
  variants: SellerProductVariant[];
  isRemoved: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  status?: ProductStatus;
  lifeCycle?: ProductLifeCycle;
};

export type SellerProductListResult = {
  products: SellerProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SellerCategoryOption = {
  id: number;
  name: string;
  description?: string | null;
};

export type CreateSellerProductInput = {
  categoryId: number;
  name: string;
  description?: string;
  status?: "DRAFT" | "ACTIVE";
  variants: {
    size: string;
    color: string;
    sku: string;
    stockQuantity: number;
    price: number;
  }[];
  images: File[];
};

export type UpdateSellerProductInput = {
  categoryId?: number;
  name?: string;
  description?: string;
  variants?: CreateSellerProductInput["variants"];
  retainImagePaths?: string[];
  newImages?: File[];
};

export type CreateSellerVariantInput = {
  productId: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
};

export type UpdateSellerVariantInput = {
  size?: string;
  color?: string;
  sku?: string;
  stock?: number;
  price?: number;
};

export type SellerVariantListParams = {
  page?: number;
  limit?: number;
  productId?: string | number;
  search?: string;
  sku?: string;
  color?: string;
  size?: string;
};

export type SellerVariantListResult = {
  variants: SellerProductVariant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function isProductDraft(product: SellerProduct): boolean {
  return product.status === "DRAFT" && !product.isRemoved;
}

export function isProductActive(product: SellerProduct): boolean {
  return product.status === "ACTIVE" && !product.isRemoved;
}

export function isProductArchived(product: SellerProduct): boolean {
  return product.status === "ARCHIVED" && !product.isRemoved;
}

export function canPublishProduct(product: SellerProduct): boolean {
  return isProductDraft(product);
}

export function canArchiveProduct(product: SellerProduct): boolean {
  return isProductActive(product);
}

export function canRestoreProduct(product: SellerProduct): boolean {
  return product.isRemoved || isProductArchived(product);
}
