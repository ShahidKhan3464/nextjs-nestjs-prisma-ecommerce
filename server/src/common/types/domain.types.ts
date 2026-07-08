import type { OrderStatus } from 'src/common/enums/order-status.enum';
import type { PaymentStatus } from 'src/common/enums/payment-status.enum';
import type { ProductStatus } from 'src/common/enums/product-status.enum';
import type {
  User,
  Order,
  CartItem,
  Category,
  OrderItem,
  StoredFile,
  ProductVariant,
  CheckoutSession,
  CheckoutSessionItem,
} from 'src/generated/prisma/client';

export type ProductWithRelations = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  basePrice: number;
  categoryId: number;
  slug: string | null;
  category?: Category;
  images?: StoredFile[];
  status: ProductStatus;
  deletedAt: Date | null;
  description: string | null;
  variants?: ProductVariantWithRelations[];
};

export type ProductVariantWithRelations = Omit<ProductVariant, 'price'> & {
  price: number;
  product?: ProductWithRelations;
};

export type CartItemWithRelations = CartItem & {
  variant: ProductVariantWithRelations & { product: ProductWithRelations };
  user?: User;
};

export type OrderItemWithRelations = Omit<OrderItem, 'priceAtPurchase'> & {
  priceAtPurchase: number;
  variant?: ProductVariantWithRelations;
};

export type OrderWithRelations = Omit<
  Order,
  'status' | 'paymentStatus' | 'totalAmount' | 'subtotal' | 'tax'
> & {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  user?: User;
  items?: OrderItemWithRelations[];
};

export type CheckoutSessionWithRelations = Omit<
  CheckoutSession,
  'totalAmount' | 'subtotal' | 'tax'
> & {
  totalAmount: number;
  subtotal: number;
  tax: number;
  items: CheckoutSessionItemWithRelations[];
};

type CheckoutSessionItemWithRelations = Omit<
  CheckoutSessionItem,
  'priceAtPurchase'
> & {
  priceAtPurchase: number;
  variant: ProductVariantWithRelations & { product: ProductWithRelations };
};
