import type {
  FilterOption,
  ProductLifeCycleFilterValue,
  ProductStatusFilterValue,
} from "../types";

export const PRODUCT_STATUS_FILTER_OPTIONS: FilterOption<ProductStatusFilterValue>[] =
  [
    { value: "all", label: "All" },
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Published" },
  ];

export const PRODUCT_LIFECYCLE_FILTER_OPTIONS: FilterOption<ProductLifeCycleFilterValue>[] =
  [
    { value: "all", label: "All" },
    { value: "active", label: "In catalog" },
    { value: "removed", label: "Removed" },
  ];
