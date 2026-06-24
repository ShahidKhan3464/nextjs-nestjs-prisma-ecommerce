export type ProductListParams = {
  q?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: number;
};

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  productId: string;
  compareAtPrice?: number;
  options?: {
    size?: string;
    color?: string;
  };
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  basePrice: number;
  description: string;
  isRemoved?: boolean;
  variants: ProductVariant[];
};
