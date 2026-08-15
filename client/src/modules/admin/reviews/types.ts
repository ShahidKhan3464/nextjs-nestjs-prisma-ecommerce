import type { ReviewListParams } from "@/modules/buyer/reviews/types";

export type AdminReviewListParams = ReviewListParams & {
  productId?: string;
  storeId?: string;
  userId?: string;
};
