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

export type DashboardRecentCustomer = {
  id: string;
  fullName: string;
  email: string;
  ordersCount: number;
  lastOrderAt: string;
};

export type DashboardPendingApproval = {
  id: string;
  kind: 'seller' | 'store';
  name: string;
  status: string;
  createdAt: string;
};

export type DashboardPurchasedProduct = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  purchasedAt: string;
};

export type AdminDashboardResponse = {
  totals: {
    revenue: number;
    orders: number;
    products: number;
    variants: number;
    customers: number;
    pendingOrders: number;
    pendingSellerApprovals: number;
  };
  recentOrders: OrderResponse[];
  lowStock: DashboardLowStockItem[];
  topProducts: DashboardTopProduct[];
  recentReviews: DashboardReviewItem[];
  revenueByDay: DashboardRevenuePoint[];
  ordersByStatus: DashboardStatusCount[];
  recentCustomers: DashboardRecentCustomer[];
  recentNotifications: DashboardActivityItem[];
  pendingApprovals: DashboardPendingApproval[];
};

export type CustomerDashboardResponse = {
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  cartItemCount: number;
  recentOrders: OrderResponse[];
  ordersByStatus: DashboardStatusCount[];
  spendingByMonth: DashboardSpendingPoint[];
  recentNotifications: DashboardActivityItem[];
  recentlyPurchased: DashboardPurchasedProduct[];
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
  averageRating: number;
  totalReviews: number;
  productsSold: number;
};

export type SellerDashboardResponse = {
  store: SellerStoreSummary;
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    totalReviews: number;
    pendingOrders: number;
    lowStockCount: number;
    averageRating: number;
  };
  recentOrders: OrderResponse[];
  lowStock: DashboardLowStockItem[];
  topProducts: DashboardTopProduct[];
  recentReviews: DashboardReviewItem[];
  revenueByDay: DashboardRevenuePoint[];
  ordersByStatus: DashboardStatusCount[];
  recentActivity: DashboardActivityItem[];
};
