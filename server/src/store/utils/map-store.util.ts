import { StoreStatus, StoreFileType } from '../constants/store.constants';

export type StoreFileMapped = {
  id: number;
  type: StoreFileType;
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

export type StoreMapped = {
  id: number;
  name: string;
  slug: string;
  city: string;
  address: string;
  country: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
  sellerProfileId: number;
  status: StoreStatus;
  verifiedAt: Date | null;
  suspendedAt: Date | null;
  description: string | null;
  suspensionReason: string | null;
  files: StoreFileMapped[];
  sellerProfile: {
    id: number;
    userId: number;
    status: string;
    businessName: string;
  };
};

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
    sellerProfileId: store.sellerProfileId,
    status: store.status as StoreStatus,
    suspensionReason: store.suspensionReason,
    sellerProfile: {
      id: store.sellerProfile.id,
      userId: store.sellerProfile.userId,
      status: store.sellerProfile.status,
      businessName: store.sellerProfile.businessName,
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
