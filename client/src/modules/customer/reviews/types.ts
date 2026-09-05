export type ReviewBuyer = {
  id: string;
  displayName: string;
};

export type ReviewProductSummary = {
  id: string;
  name: string;
  slug: string;
  storeId: string;
};

export type Review = {
  id: string;
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  buyer: ReviewBuyer;
  product?: ReviewProductSummary;
  createdAt: string;
  updatedAt: string;
};

export type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type ReviewSummary = {
  productId: string;
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
};

export type CreateReviewInput = {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
};

export type UpdateReviewInput = {
  rating?: number;
  title?: string | null;
  comment?: string | null;
};

export type ReviewListParams = {
  page?: number;
  limit?: number;
  rating?: number;
};

export type ReviewListResult = {
  reviews: Review[];
  page: number;
  limit: number;
  total: number;
};
