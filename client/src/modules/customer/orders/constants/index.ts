import type {
  FilterOption,
  OrderStatusFilterValue,
  OrderPaymentStatusFilterValue,
} from "../types";

export const ORDER_STATUS_FILTER_OPTIONS: FilterOption<OrderStatusFilterValue>[] =
  [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

export const BUYER_PAYMENT_STATUS_FILTER_OPTIONS: FilterOption<OrderPaymentStatusFilterValue>[] =
  [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "refunded", label: "Refunded" },
  ];

export const SELLER_PAYMENT_STATUS_FILTER_OPTIONS: FilterOption<OrderPaymentStatusFilterValue>[] =
  [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "refunded", label: "Refunded" },
    { value: "pending", label: "Pending" },
  ];
