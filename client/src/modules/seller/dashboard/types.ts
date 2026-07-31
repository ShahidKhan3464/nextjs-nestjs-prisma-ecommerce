import type { Order } from "@/modules/customer/orders/types";

type DashboardStatusCount = {
  count: number;
  status: string;
};

export type SellerStoreSummary = {
  id: number;
  name: string;
  slug: string;
  city: string;
  status: string;
  country: string;
  address: string;
  description: string | null;
  verifiedAt: string | null;
  businessName: string;
};

export type SellerDashboardActivity = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type SellerDashboardData = {
  store: SellerStoreSummary;
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    pendingOrders: number;
    lowStockCount: number;
  };
  recentOrders: Order[];
  ordersByStatus: DashboardStatusCount[];
  revenueByDay: { date: string; revenue: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
  recentActivity: SellerDashboardActivity[];
};
