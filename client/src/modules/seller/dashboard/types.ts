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
  averageRating: number;
  totalReviews: number;
  productsSold: number;
};

export type SellerDashboardActivity = {
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
  title: string | null;
  comment: string | null;
  productName: string;
  productSlug: string;
  buyerName: string;
  createdAt: string;
};

export type DashboardTopProduct = {
  productId: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
  averageRating: number;
  reviewCount: number;
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
    averageRating: number;
    totalReviews: number;
  };
  recentOrders: Order[];
  ordersByStatus: DashboardStatusCount[];
  recentActivity: SellerDashboardActivity[];
  revenueByDay: { date: string; revenue: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
  recentReviews: DashboardReviewItem[];
  topProducts: DashboardTopProduct[];
};
