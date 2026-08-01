import type {
  Order,
  OrderListParams,
} from "@/modules/customer/orders/types";

export type OrderBuyer = {
  id: string;
  email: string;
  fullName: string;
};

export type SellerOrder = Order & {
  buyer?: OrderBuyer;
};

export type SellerOrderListParams = Pick<
  OrderListParams,
  "status" | "paymentStatus"
>;

export type UpdateSellerOrderStatus = "SHIPPED" | "DELIVERED";
