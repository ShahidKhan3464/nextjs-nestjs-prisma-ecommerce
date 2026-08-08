import type { Store, StoreStatus } from "@/modules/seller/store/types";

export type { Store, StoreStatus };

export type StoreStatusFilter = StoreStatus | "ALL";

export type AdminStoreListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: StoreStatus;
};

export type AdminStoreListResult = {
  data: Store[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
};

export type SuspendStoreInput = {
  suspensionReason?: string;
};
