import { ReviewRow } from './map-review.util';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export const reviewBuyerSelect = {
  id: true,
  fullName: true,
} satisfies Prisma.UserSelect;

export const reviewProductSelect = {
  id: true,
  name: true,
  slug: true,
  storeId: true,
  deletedAt: true,
} satisfies Prisma.ProductSelect;

export const reviewListInclude = {
  user: { select: reviewBuyerSelect },
  product: { select: reviewProductSelect },
} satisfies Prisma.ReviewInclude;

type FindReviewsArgs = {
  where: Prisma.ReviewWhereInput;
  orderBy?: Prisma.ReviewOrderByWithRelationInput;
  skip?: number;
  take?: number;
};

export async function findReviewsWithRelations(
  prisma: PrismaService,
  args: FindReviewsArgs,
): Promise<ReviewRow[]> {
  return prisma.review.findMany({
    where: args.where,
    orderBy: args.orderBy ?? { createdAt: 'desc' },
    skip: args.skip,
    take: args.take,
    include: reviewListInclude,
  });
}

export async function findReviewWithRelations(
  prisma: PrismaService,
  where: Prisma.ReviewWhereInput,
): Promise<ReviewRow | null> {
  return prisma.review.findFirst({
    where,
    include: reviewListInclude,
  });
}
