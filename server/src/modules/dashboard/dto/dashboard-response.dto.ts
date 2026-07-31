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
}
