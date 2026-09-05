import { User } from "@/types";
import type { Order } from "@/modules/buyer/orders/types";
import type { Address } from "@/modules/buyer/orders/types";

export type { User };

export type BlockTarget = {
  user: User;
  isBlocked: boolean;
};

export type AdminUserDetail = {
  user: User;
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  recentOrders: Order[];
  profilePhotoUrl?: string;
  defaultAddress?: Address;
  billingAddresses: Address[];
  shippingAddresses: Address[];
};
