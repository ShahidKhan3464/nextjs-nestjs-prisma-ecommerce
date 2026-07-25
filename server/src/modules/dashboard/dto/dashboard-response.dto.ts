import { ApiProperty } from '@nestjs/swagger';
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
