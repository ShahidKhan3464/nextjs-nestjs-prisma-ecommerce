import type { Order, OrderListParams } from "@/modules/buyer/orders/types";

type OrderBuyer = {
  id: string;
  email: string;
  fullName: string;
};

export type SellerOrder = Order & {
  buyer?: OrderBuyer;
};

export type SellerOrderListParams = Pick<
  OrderListParams,
  "status" | "paymentStatus" | "page" | "limit"
>;

export type UpdateSellerOrderStatus = "SHIPPED" | "DELIVERED";
