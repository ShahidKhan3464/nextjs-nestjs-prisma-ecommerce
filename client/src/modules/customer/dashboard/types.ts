import type { Order } from "@/modules/buyer/orders/types";

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

export type BuyerDashboardData = {
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
