import { GetProductsProvider } from './get-products.provider';

describe('GetProductsProvider rating sort', () => {
  const prisma = {
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const paginationProviders = {
    resolvePaging: () => ({ page: 1, limit: 2, skip: 0 }),
  };

  const provider = new GetProductsProvider(
    prisma as never,
    paginationProviders as never,
    {} as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('orders by denormalized averageRating in SQL before pagination', async () => {
    prisma.product.count.mockResolvedValue(2);
    prisma.product.findMany.mockResolvedValue([
      {
        id: 2,
        name: 'High',
        slug: 'high',
        storeId: 1,
        categoryId: 1,
        description: null,
        basePrice: 10,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        publishedAt: null,
        averageRating: 4.7,
        reviewCount: 3,
        variants: [],
        files: [],
      },
    ]);

    const result = await provider.findAllPaginated({
      sort: 'rating_desc',
      page: 1,
      limit: 2,
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ averageRating: 'desc' }, { id: 'desc' }],
        skip: 0,
        take: 2,
      }),
    );
    expect(result.data[0]?.averageRating).toBe(4.7);
    expect(result.data[0]?.reviewCount).toBe(3);
    expect(result.total).toBe(2);
  });

  it('filters minRating on the stored average', async () => {
    prisma.product.count.mockResolvedValue(0);
    prisma.product.findMany.mockResolvedValue([]);

    await provider.findAllPaginated({ minRating: 4, page: 1, limit: 10 });

    expect(prisma.product.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        averageRating: { gte: 4 },
      }),
    });
  });
});
