import type { SellerProductVariant } from "@/modules/seller/products/types";

export type NestSellerProductVariantDto = {
  id: number;
  sku: string;
  size: string;
  color: string;
  price: number | string;
  productId: number;
  stockQuantity?: number;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function mapNestSellerProductVariant(
  v: NestSellerProductVariantDto
): SellerProductVariant {
  return {
    id: String(v.id),
    productId: String(v.productId),
    sku: v.sku,
    size: v.size,
    color: v.color,
    price: Number(v.price),
    stock: v.stockQuantity ?? v.stock ?? 0,
  };
}

/** Client `stock` → Nest `stockQuantity` for standalone variant APIs. */
export function toNestCreateVariantBody(input: {
  productId: string | number;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
}) {
  return {
    productId: Number(input.productId),
    size: input.size.trim(),
    color: input.color.trim(),
    sku: input.sku.trim(),
    stockQuantity: input.stock,
    price: input.price,
  };
}

export function toNestUpdateVariantBody(input: {
  size?: string;
  color?: string;
  sku?: string;
  stock?: number;
  price?: number;
}) {
  const body: Record<string, string | number> = {};
  if (input.size !== undefined) body.size = input.size.trim();
  if (input.color !== undefined) body.color = input.color.trim();
  if (input.sku !== undefined) body.sku = input.sku.trim();
  if (input.stock !== undefined) body.stockQuantity = input.stock;
  if (input.price !== undefined) body.price = input.price;
  return body;
}
