import type { StoreStatusFilter } from "../types";

export const STORE_STATUS_FILTER_OPTIONS: {
  value: StoreStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
];
