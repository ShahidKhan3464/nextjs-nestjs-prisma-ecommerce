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
  businessName: string;
  verifiedAt: string | null;
  description: string | null;
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
  recentActivity: SellerDashboardActivity[];
  revenueByDay: { date: string; revenue: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
};
