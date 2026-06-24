import type { Order } from "@/modules/customer/orders/types";

type DashboardStatusCount = {
  count: number;
  status: string;
};

export type AdminAnalyticsData = {
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    customers: number;
    pendingOrders: number;
  };
  recentOrders: Order[];
  ordersByStatus: DashboardStatusCount[];
  revenueByDay: { date: string; revenue: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
};
