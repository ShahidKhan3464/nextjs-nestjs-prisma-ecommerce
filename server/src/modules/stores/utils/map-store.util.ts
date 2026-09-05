import type { StoreMapped } from '../types/store.types';
import { StoreStatus, StoreFileType } from '../constants/store.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';

export type { StoreMapped } from '../types/store.types';

type StoreFileSource = {
  id: number;
  type: string;
  sortOrder: number;
  file: {
    id: number;
    urlPath: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
    originalName: string;
  };
};

type StoreSource = {
  id: number;
  name: string;
  slug: string;
  city: string;
  status: string;
  address: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  postalCode: string;
  sellerProfileId: number;
  verifiedAt: Date | null;
  suspendedAt: Date | null;
  description: string | null;
  suspensionReason: string | null;
  files?: StoreFileSource[];
  sellerProfile: {
    id: number;
    userId: number;
    status: string;
    businessName: string;
  };
};

export function mapStoreToResponse(store: StoreSource): StoreMapped {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    city: store.city,
    address: store.address,
    country: store.country,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    postalCode: store.postalCode,
    verifiedAt: store.verifiedAt,
    suspendedAt: store.suspendedAt,
    description: store.description,
    status: store.status as StoreStatus,
    sellerProfileId: store.sellerProfileId,
    suspensionReason: store.suspensionReason,
    sellerProfile: {
      id: store.sellerProfile.id,
      userId: store.sellerProfile.userId,
      businessName: store.sellerProfile.businessName,
      status: store.sellerProfile.status as SellerProfileStatus,
    },
    files: (store.files ?? []).map((entry) => ({
      id: entry.id,
      sortOrder: entry.sortOrder,
      type: entry.type as StoreFileType,
      file: {
        id: entry.file.id,
        urlPath: entry.file.urlPath,
        mimeType: entry.file.mimeType,
        fileSize: entry.file.fileSize,
        createdAt: entry.file.createdAt,
        originalName: entry.file.originalName,
      },
    })),
  };
}

/** Public storefront payload — no seller userId or suspension internals. */
export function mapPublicStoreToResponse(store: StoreSource): StoreMapped {
  const mapped = mapStoreToResponse(store);
  const { userId: _userId, ...sellerProfile } = mapped.sellerProfile;
  return {
    ...mapped,
    suspendedAt: null,
    suspensionReason: null,
    sellerProfile,
  };
}
