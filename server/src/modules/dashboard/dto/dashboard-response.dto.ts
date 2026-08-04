import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderResponseDto } from 'src/modules/orders/dto/order-response.dto';

export class DashboardStatusCountDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;
}

export class DashboardRevenuePointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  revenue: number;
}

export class DashboardSpendingPointDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  amount: number;
}

export class DashboardLowStockItemDto {
  @ApiProperty()
  sku: string;

  @ApiProperty()
  product: string;

  @ApiProperty()
  stock: number;
}

export class DashboardActivityItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: string;
}

export class DashboardReviewItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional({ nullable: true })
  title: string | null;

  @ApiPropertyOptional({ nullable: true })
  comment: string | null;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productSlug: string;

  @ApiProperty()
  buyerName: string;

  @ApiProperty()
  createdAt: string;
}

export class DashboardTopProductDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  unitsSold: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  reviewCount: number;
}

export class DashboardRecentCustomerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  ordersCount: number;

  @ApiProperty()
  lastOrderAt: string;
}

export class DashboardPendingApprovalDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['seller', 'store'] })
  kind: 'seller' | 'store';

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: string;
}

export class DashboardPurchasedProductDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  imageUrl: string | null;

  @ApiProperty()
  purchasedAt: string;
}

export class AdminDashboardTotalsDto {
  @ApiProperty()
  revenue: number;

  @ApiProperty()
  orders: number;

  @ApiProperty()
  products: number;

  @ApiProperty()
  variants: number;

  @ApiProperty()
  customers: number;

  @ApiProperty()
  pendingOrders: number;

  @ApiProperty()
  pendingSellerApprovals: number;
}

/** Mirrors `AdminDashboardResponse`. */
export class AdminDashboardResponseDto {
  @ApiProperty({ type: AdminDashboardTotalsDto })
  totals: AdminDashboardTotalsDto;

  @ApiProperty({ type: [OrderResponseDto] })
  recentOrders: OrderResponseDto[];

  @ApiProperty({ type: [DashboardLowStockItemDto] })
  lowStock: DashboardLowStockItemDto[];

  @ApiProperty({ type: [DashboardRevenuePointDto] })
  revenueByDay: DashboardRevenuePointDto[];

  @ApiProperty({ type: [DashboardStatusCountDto] })
  ordersByStatus: DashboardStatusCountDto[];

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentNotifications: DashboardActivityItemDto[];

  @ApiProperty({ type: [DashboardReviewItemDto] })
  recentReviews: DashboardReviewItemDto[];

  @ApiProperty({ type: [DashboardPendingApprovalDto] })
  pendingApprovals: DashboardPendingApprovalDto[];

  @ApiProperty({ type: [DashboardTopProductDto] })
  topProducts: DashboardTopProductDto[];

  @ApiProperty({ type: [DashboardRecentCustomerDto] })
  recentCustomers: DashboardRecentCustomerDto[];
}

/** Mirrors `CustomerDashboardResponse`. */
export class CustomerDashboardResponseDto {
  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalSpending: number;

  @ApiProperty()
  wishlistCount: number;

  @ApiProperty()
  cartItemCount: number;

  @ApiProperty({ type: [OrderResponseDto] })
  recentOrders: OrderResponseDto[];

  @ApiProperty({ type: [DashboardStatusCountDto] })
  ordersByStatus: DashboardStatusCountDto[];

  @ApiProperty({ type: [DashboardSpendingPointDto] })
  spendingByMonth: DashboardSpendingPointDto[];

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentNotifications: DashboardActivityItemDto[];

  @ApiProperty({ type: [DashboardPurchasedProductDto] })
  recentlyPurchased: DashboardPurchasedProductDto[];
}

export class SellerStoreSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt: Date | null;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  productsSold: number;
}

export class SellerDashboardTotalsDto {
  @ApiProperty()
  revenue: number;

  @ApiProperty()
  orders: number;

  @ApiProperty()
  products: number;

  @ApiProperty()
  variants: number;

  @ApiProperty()
  pendingOrders: number;

  @ApiProperty()
  lowStockCount: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;
}

/** Mirrors `SellerDashboardResponse`. */
export class SellerDashboardResponseDto {
  @ApiProperty({ type: SellerStoreSummaryDto })
  store: SellerStoreSummaryDto;

  @ApiProperty({ type: SellerDashboardTotalsDto })
  totals: SellerDashboardTotalsDto;

  @ApiProperty({ type: [OrderResponseDto] })
  recentOrders: OrderResponseDto[];

  @ApiProperty({ type: [DashboardLowStockItemDto] })
  lowStock: DashboardLowStockItemDto[];

  @ApiProperty({ type: [DashboardRevenuePointDto] })
  revenueByDay: DashboardRevenuePointDto[];

  @ApiProperty({ type: [DashboardStatusCountDto] })
  ordersByStatus: DashboardStatusCountDto[];

  @ApiProperty({ type: [DashboardActivityItemDto] })
  recentActivity: DashboardActivityItemDto[];

  @ApiProperty({ type: [DashboardReviewItemDto] })
  recentReviews: DashboardReviewItemDto[];

  @ApiProperty({ type: [DashboardTopProductDto] })
  topProducts: DashboardTopProductDto[];
}
