import { CreateReviewProvider } from './create-review.provider';

describe('CreateReviewProvider stats sync', () => {
  const tx = {
    $queryRaw: jest.fn(),
    review: {
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    product: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };
  const eligibility = {
    assertProductReviewable: jest.fn(),
    assertBuyerEligibleToReview: jest.fn(),
  };

  const provider = new CreateReviewProvider(
    prisma as never,
    eligibility as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(async (fn) => fn(tx));
    eligibility.assertProductReviewable.mockResolvedValue(undefined);
    eligibility.assertBuyerEligibleToReview.mockResolvedValue(undefined);
    tx.review.create.mockResolvedValue({
      id: 1,
      userId: 4,
      productId: 8,
      rating: 5,
      title: null,
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tx.review.aggregate.mockResolvedValue({
      _sum: { rating: 5 },
      _count: { _all: 1 },
    });
    tx.product.update.mockResolvedValue({});
  });

  it('locks the product and writes denormalized rating stats', async () => {
    await provider.create(4, { productId: 8, rating: 5 });

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { averageRating: 5, reviewCount: 1 },
    });
  });
});
