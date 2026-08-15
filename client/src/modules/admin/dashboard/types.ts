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

export type DashboardReviewItem = {
  id: string;
  rating: number;
  buyerName: string;
  createdAt: string;
  productSlug: string;
  productName: string;
  title: string | null;
  comment: string | null;
};

export type DashboardTopProduct = {
  name: string;
  slug: string;
  revenue: number;
  productId: string;
  unitsSold: number;
  reviewCount: number;
  averageRating: number;
};

export type DashboardRecentCustomer = {
  id: string;
  email: string;
  fullName: string;
  ordersCount: number;
  lastOrderAt: string;
};

export type DashboardPendingApproval = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  kind: "seller" | "store";
};

export type AdminAnalyticsData = {
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    customers: number;
    pendingOrders: number;
    pendingSellerApprovals: number;
  };
  recentOrders: Order[];
  topProducts: DashboardTopProduct[];
  recentReviews: DashboardReviewItem[];
  ordersByStatus: DashboardStatusCount[];
  recentCustomers: DashboardRecentCustomer[];
  pendingApprovals: DashboardPendingApproval[];
  recentNotifications: DashboardActivityItem[];
  revenueByDay: { date: string; revenue: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
};
