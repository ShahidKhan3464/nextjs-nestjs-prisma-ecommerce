const VARIANT_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  storeId: true,
  deletedAt: true,
  basePrice: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      deletedAt: true,
      sellerProfile: {
        select: {
          id: true,
          userId: true,
          status: true,
          businessName: true,
        },
      },
    },
  },
} as const;

export const VARIANT_INCLUDE = {
  product: {
    select: VARIANT_PRODUCT_SELECT,
  },
} as const;

export const VARIANT_OWNERSHIP_INCLUDE = {
  product: {
    select: {
      id: true,
      storeId: true,
      deletedAt: true,
      store: {
        select: {
          id: true,
          status: true,
          deletedAt: true,
          sellerProfile: {
            select: {
              id: true,
              userId: true,
              status: true,
            },
          },
        },
      },
    },
  },
} as const;
