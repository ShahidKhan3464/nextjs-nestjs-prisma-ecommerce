import type { ReviewListParams } from "@/modules/customer/reviews/types";

export type AdminReviewListParams = ReviewListParams & {
  productId?: string;
  storeId?: string;
  userId?: string;
};
