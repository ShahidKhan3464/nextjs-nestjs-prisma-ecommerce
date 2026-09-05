export const NOTIFICATION_TYPES = [
  "ORDER_CREATED",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "SELLER_APPROVED",
  "SELLER_REJECTED",
  "PRODUCT_APPROVED",
  "PRODUCT_REJECTED",
  "STORE_ANNOUNCEMENT",
  "PRODUCT_BACK_IN_STOCK",
  "SYSTEM",
] as const;

export const NOTIFICATION_TYPE_LABELS: Record<
  (typeof NOTIFICATION_TYPES)[number],
  string
> = {
  ORDER_CREATED: "Order placed",
  ORDER_SHIPPED: "Order shipped",
  ORDER_DELIVERED: "Order delivered",
  ORDER_CANCELLED: "Order cancelled",
  SELLER_APPROVED: "Seller approved",
  SELLER_REJECTED: "Seller rejected",
  PRODUCT_APPROVED: "Product approved",
  PRODUCT_REJECTED: "Product rejected",
  STORE_ANNOUNCEMENT: "Store announcement",
  PRODUCT_BACK_IN_STOCK: "Back in stock",
  SYSTEM: "System",
};

export const READ_FILTERS = ["all", "unread", "read"] as const;
