import type { Order } from "@/modules/customer/orders/types";

type DashboardStatusCount = {
  count: number;
  status: string;
};

export type CustomerDashboardData = {
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  cartItemCount: number;
  recentOrders: Order[];
  ordersByStatus: DashboardStatusCount[];
  spendingByMonth: { month: string; amount: number }[];
};
