import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Mirrors `OrderAddress` from `map-order.util.ts`. */
export class OrderAddressDto {
  @ApiProperty()
  city: string;

  @ApiProperty()
  line1: string;

  @ApiPropertyOptional()
  line2?: string;

  @ApiProperty()
  region: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  postalCode: string;
}

export class OrderLineItemResponseDto {
  @ApiPropertyOptional()
  image?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  variantLabel: string;

  @ApiProperty()
  priceAtPurchase: number;

  @ApiPropertyOptional()
  sku?: string;
}

export class OrderStoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  verified: boolean;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiProperty()
  sellerName: string;
}

export class OrderBuyerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;
}

/** Mirrors `OrderResponse` from `mapOrderToResponse`. */
export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tax: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  shippedAt?: string;

  @ApiProperty()
  orderNumber: string;

  @ApiPropertyOptional()
  deliveredAt?: string;

  @ApiPropertyOptional()
  cancelledAt?: string;

  @ApiProperty()
  paymentStatus: string;

  @ApiPropertyOptional({ type: OrderStoreResponseDto })
  store?: OrderStoreResponseDto;

  @ApiPropertyOptional({ type: OrderBuyerResponseDto })
  buyer?: OrderBuyerResponseDto;

  @ApiPropertyOptional()
  cancellationReason?: string;

  @ApiProperty()
  paymentMethodSummary: string;

  @ApiProperty({ type: OrderAddressDto })
  shippingAddress: OrderAddressDto;

  @ApiProperty({ type: [OrderLineItemResponseDto] })
  items: OrderLineItemResponseDto[];
}

export class PaginatedOrderResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  data: OrderResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}

export class CheckoutPreviewDto {
  @ApiProperty()
  tax: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  subtotal: number;
}

/** Mirrors `CheckoutSessionResponse` from create-checkout.provider. */
export class CheckoutSessionResponseDto {
  @ApiProperty()
  clientSecret: string;

  @ApiProperty()
  paymentIntentId: string;

  @ApiProperty({ type: CheckoutPreviewDto })
  preview: CheckoutPreviewDto;

  @ApiProperty()
  checkoutSessionId: string;

  @ApiProperty({ type: [String] })
  orderIds: string[];
}

/** Mirrors `CompleteCheckoutResponse`. */
export class CompleteCheckoutResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];
}
