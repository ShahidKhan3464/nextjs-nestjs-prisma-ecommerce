import { UpdateReviewProvider } from './update-review.provider';
import { DeleteReviewProvider } from './delete-review.provider';
import * as reviewQuery from '../utils/review-query.util';

jest.mock('../utils/review-query.util', () => ({
  reviewListInclude: {},
  findReviewWithRelations: jest.fn(),
}));

describe('review update/delete stats sync', () => {
  const existing = {
    id: 1,
    userId: 4,
    productId: 8,
    rating: 3,
    title: null,
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tx = {
    $queryRaw: jest.fn(),
    review: {
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    product: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };
  const ownership = {
    assertCanUpdate: jest.fn(),
    assertCanDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(async (fn) => fn(tx));
    (reviewQuery.findReviewWithRelations as jest.Mock).mockResolvedValue(
      existing,
    );
    tx.review.update.mockResolvedValue(existing);
    tx.review.delete.mockResolvedValue(existing);
    tx.review.aggregate.mockResolvedValue({
      _sum: { rating: 4 },
      _count: { _all: 1 },
    });
    tx.product.update.mockResolvedValue({});
  });

  it('recalculates stats when a rating is updated', async () => {
    const provider = new UpdateReviewProvider(
      prisma as never,
      ownership as never,
    );
    await provider.update(1, 4, { rating: 4 });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { averageRating: 4, reviewCount: 1 },
    });
  });

  it('recalculates stats when a review is deleted', async () => {
    tx.review.aggregate.mockResolvedValue({
      _sum: { rating: 0 },
      _count: { _all: 0 },
    });
    const provider = new DeleteReviewProvider(
      prisma as never,
      ownership as never,
    );
    await provider.delete(1, 4, []);
    expect(tx.review.delete).toHaveBeenCalled();
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { averageRating: 0, reviewCount: 0 },
    });
  });
});
