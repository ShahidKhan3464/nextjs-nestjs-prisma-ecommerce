import { OrderResponse } from 'src/modules/orders/utils/map-order.util';

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardRevenuePoint = {
  date: string;
  revenue: number;
};

export type DashboardSpendingPoint = {
  month: string;
  amount: number;
};

export type DashboardLowStockItem = {
  sku: string;
  product: string;
  stock: number;
};

export type AdminDashboardResponse = {
  totals: {
    revenue: number;
    orders: number;
    products: number;
    variants: number;
    customers: number;
    pendingOrders: number;
  };
  recentOrders: OrderResponse[];
  lowStock: DashboardLowStockItem[];
  revenueByDay: DashboardRevenuePoint[];
  ordersByStatus: DashboardStatusCount[];
};

export type CustomerDashboardResponse = {
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  cartItemCount: number;
  recentOrders: OrderResponse[];
  ordersByStatus: DashboardStatusCount[];
  spendingByMonth: DashboardSpendingPoint[];
};

export type SellerStoreSummary = {
  id: number;
  name: string;
  slug: string;
  city: string;
  status: string;
  country: string;
  address: string;
  businessName: string;
  verifiedAt: Date | null;
  description: string | null;
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type SellerDashboardResponse = {
  store: SellerStoreSummary;
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    pendingOrders: number;
    lowStockCount: number;
  };
  recentOrders: OrderResponse[];
  lowStock: DashboardLowStockItem[];
  revenueByDay: DashboardRevenuePoint[];
  ordersByStatus: DashboardStatusCount[];
  recentActivity: DashboardActivityItem[];
};
