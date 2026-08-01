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
    logoUrl?: string | null;
    deletedAt?: Date | null;
    verifiedAt?: Date | null;
    sellerProfile?: {
      id: number;
      status: string;
      userId?: number;
      businessName?: string;
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

/** Line items use purchase-time snapshots; variant is id/productId only when needed. */
export type OrderItemWithRelations = Omit<OrderItem, 'priceAtPurchase'> & {
  priceAtPurchase: number;
  variant?: {
    id: number;
    productId: number;
  };
};

export type PaymentWithRelations = Omit<
  Payment,
  'amount' | 'refundedAmount' | 'status' | 'provider'
> & {
  amount: number;
  status: PaymentStatus;
  refundedAmount: number;
  provider: PaymentProvider;
};

export type OrderStoreSummary = {
  id: number;
  name: string;
  slug: string;
  status: string;
  deletedAt?: Date | null;
};

export type OrderWithRelations = Omit<
  Order,
  'status' | 'totalAmount' | 'subtotal' | 'tax'
> & {
  tax: number;
  subtotal: number;
  status: OrderStatus;
  totalAmount: number;
  store?: OrderStoreSummary;
  items?: OrderItemWithRelations[];
  payment?: PaymentWithRelations | null;
  user?: Pick<User, 'id' | 'email' | 'fullName'>;
};

export type CheckoutSessionWithRelations = Omit<
  CheckoutSession,
  'totalAmount' | 'subtotal' | 'tax' | 'status'
> & {
  tax: number;
  subtotal: number;
  totalAmount: number;
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
