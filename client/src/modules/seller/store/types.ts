export const STORE_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export const STORE_FILE_TYPES = ["LOGO", "BANNER"] as const;
export type StoreFileType = (typeof STORE_FILE_TYPES)[number];

type StoreFileAsset = {
  id: number;
  originalName: string;
  mimeType: string;
  fileSize: number;
  urlPath: string;
  createdAt: string;
};

export type StoreFile = {
  id: number;
  type: StoreFileType;
  sortOrder: number;
  file: StoreFileAsset;
};

export type StoreSellerProfile = {
  id: number;
  userId: number;
  status: string;
  businessName: string;
};

export type Store = {
  id: number;
  sellerProfileId: number;
  name: string;
  slug: string;
  status: StoreStatus;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  description: string | null;
  verifiedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
  sellerProfile: StoreSellerProfile;
  files: StoreFile[];
  averageRating?: number;
  totalReviews?: number;
  productsSold?: number;
};

export type UpdateStoreInput = {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

export function getStoreFile(
  store: Store,
  type: StoreFileType
): StoreFile | undefined {
  return store.files.find((entry) => entry.type === type);
}

export function isStoreSuspended(store: Store): boolean {
  return store.status === "SUSPENDED";
}

export function isStoreVerified(store: Store): boolean {
  return store.verifiedAt != null;
}
