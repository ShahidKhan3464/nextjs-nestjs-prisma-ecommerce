import type { OrderStatus } from 'src/common/enums/order-status.enum';
import type { PaymentStatus } from 'src/common/enums/payment-status.enum';
import type { ProductStatus } from 'src/common/enums/product-status.enum';
import type { PaymentProvider } from 'src/common/enums/payment-provider.enum';
import type { CheckoutSessionStatus } from 'src/common/enums/checkout-session-status.enum';
import type {
  User,
  Order,
  Payment,
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
  storeId: number;
  basePrice: number;
  categoryId: number;
  slug: string | null;
  category?: Category;
  store?: {
    id: number;
    name: string;
    slug: string;
    status: string;
    deletedAt?: Date | null;
    sellerProfile?: {
      id: number;
      userId: number;
      status: string;
      deletedAt?: Date | null;
    };
  };
  images?: StoredFile[];
  status: ProductStatus;
  deletedAt: Date | null;
  publishedAt: Date | null;
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

export type PaymentWithRelations = Omit<
  Payment,
  'amount' | 'refundedAmount' | 'status' | 'provider'
> & {
  amount: number;
  refundedAmount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
};

export type OrderWithRelations = Omit<
  Order,
  'status' | 'totalAmount' | 'subtotal' | 'tax'
> & {
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  user?: User;
  payment?: PaymentWithRelations | null;
  items?: OrderItemWithRelations[];
};

export type CheckoutSessionWithRelations = Omit<
  CheckoutSession,
  'totalAmount' | 'subtotal' | 'tax' | 'status'
> & {
  totalAmount: number;
  subtotal: number;
  tax: number;
  status: CheckoutSessionStatus;
  items: CheckoutSessionItemWithRelations[];
};

type CheckoutSessionItemWithRelations = Omit<
  CheckoutSessionItem,
  'priceAtPurchase'
> & {
  priceAtPurchase: number;
  variant: ProductVariantWithRelations & { product: ProductWithRelations };
};
