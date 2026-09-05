export enum SellerProfileStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum SellerDocumentType {
  TAX_DOCUMENT = 'TAX_DOCUMENT',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
}

export const SELLER_PROFILE_INCLUDE = {
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      status: true,
      address: true,
      country: true,
      createdAt: true,
      postalCode: true,
      verifiedAt: true,
      description: true,
      suspendedAt: true,
    },
  },
  sellerDocuments: {
    include: {
      file: {
        select: {
          id: true,
          urlPath: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
          originalName: true,
        },
      },
    },
  },
} as const;
