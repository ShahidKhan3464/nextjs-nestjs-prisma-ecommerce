import type { Order } from "@/modules/customer/orders/types";

type DashboardStatusCount = {
  count: number;
  status: string;
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type DashboardPurchasedProduct = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  purchasedAt: string;
};

export type CustomerDashboardData = {
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  cartItemCount: number;
  recentOrders: Order[];
  ordersByStatus: DashboardStatusCount[];
  spendingByMonth: { month: string; amount: number }[];
  recentNotifications: DashboardActivityItem[];
  recentlyPurchased: DashboardPurchasedProduct[];
};
