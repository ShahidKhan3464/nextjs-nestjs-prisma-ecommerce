import type {
  Review,
  ReviewBuyer,
  ReviewSummary,
  StoreReputation,
  RatingDistribution,
  ReviewProductSummary,
} from "@/modules/buyer/reviews/types";

type NestReviewBuyer = {
  id: string | number;
  displayName: string;
};

type NestReviewProduct = {
  id: string | number;
  name: string;
  slug: string;
  storeId: string | number;
};

export type NestReviewPayload = {
  id: string | number;
  productId: string | number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  buyer: NestReviewBuyer;
  product?: NestReviewProduct | null;
  createdAt: string;
  updatedAt: string;
};

export type NestReviewSummaryPayload = {
  productId: string | number;
  averageRating: number;
  totalReviews: number;
  distribution: {
    1?: number;
    2?: number;
    3?: number;
    4?: number;
    5?: number;
  };
};

export type NestStoreReputationPayload = {
  storeId: string | number;
  averageRating: number;
  totalReviews: number;
  productsSold: number;
  verified: boolean;
};

function mapBuyer(buyer: NestReviewBuyer): ReviewBuyer {
  return {
    id: String(buyer.id),
    displayName: buyer.displayName || "Buyer",
  };
}

function mapProduct(
  product: NestReviewProduct | null | undefined
): ReviewProductSummary | undefined {
  if (!product) return undefined;
  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug,
    storeId: String(product.storeId),
  };
}

export function normalizeNestReviewPayload(row: NestReviewPayload): Review {
  const product = mapProduct(row.product);
  return {
    id: String(row.id),
    productId: String(row.productId),
    rating: Number(row.rating),
    title: row.title ?? undefined,
    comment: row.comment ?? undefined,
    buyer: mapBuyer(row.buyer),
    ...(product ? { product } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function normalizeNestReviewSummaryPayload(
  row: NestReviewSummaryPayload
): ReviewSummary {
  const distribution: RatingDistribution = {
    1: Number(row.distribution?.[1] ?? 0),
    2: Number(row.distribution?.[2] ?? 0),
    3: Number(row.distribution?.[3] ?? 0),
    4: Number(row.distribution?.[4] ?? 0),
    5: Number(row.distribution?.[5] ?? 0),
  };
  return {
    productId: String(row.productId),
    averageRating: Number(row.averageRating ?? 0),
    totalReviews: Number(row.totalReviews ?? 0),
    distribution,
  };
}

export function normalizeNestStoreReputationPayload(
  row: NestStoreReputationPayload
): StoreReputation {
  return {
    storeId: String(row.storeId),
    averageRating: Number(row.averageRating ?? 0),
    totalReviews: Number(row.totalReviews ?? 0),
    productsSold: Number(row.productsSold ?? 0),
    verified: Boolean(row.verified),
  };
}
