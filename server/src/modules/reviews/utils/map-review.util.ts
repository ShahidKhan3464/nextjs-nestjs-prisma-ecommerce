export type ReviewBuyerSource = {
  id: number;
  fullName: string;
};

export type ReviewProductSource = {
  id: number;
  name: string;
  slug: string;
  storeId: number;
  deletedAt?: Date | null;
};

export type ReviewRow = {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: ReviewBuyerSource;
  product?: ReviewProductSource;
};

export type ReviewBuyerResponse = {
  id: string;
  displayName: string;
};

export type ReviewProductSummary = {
  id: string;
  name: string;
  slug: string;
  storeId: string;
};

export type ReviewResponse = {
  id: string;
  productId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
  comment?: string;
  buyer: ReviewBuyerResponse;
  product?: ReviewProductSummary;
};

export type MapReviewOptions = {
  /** Include product summary (seller/admin/buyer lists). */
  includeProduct?: boolean;
};

export function mapReviewToResponse(
  review: ReviewRow,
  options: MapReviewOptions = { includeProduct: false },
): ReviewResponse {
  const response: ReviewResponse = {
    id: String(review.id),
    productId: String(review.productId),
    rating: review.rating,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    title: review.title ?? undefined,
    comment: review.comment ?? undefined,
    buyer: {
      id: String(review.user?.id ?? review.userId),
      displayName: review.user?.fullName ?? 'Buyer',
    },
  };

  if (options.includeProduct && review.product) {
    response.product = {
      id: String(review.product.id),
      name: review.product.name,
      slug: review.product.slug,
      storeId: String(review.product.storeId),
    };
  }

  return response;
}
