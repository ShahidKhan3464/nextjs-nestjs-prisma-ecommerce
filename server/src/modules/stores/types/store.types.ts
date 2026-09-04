import { StoreStatus, StoreFileType } from '../constants/store.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';

type StoreFileMapped = {
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
    /** Present for owner/admin responses; omitted on public storefront payloads. */
    userId?: number;
    status: SellerProfileStatus;
    businessName: string;
  };
  averageRating?: number;
  totalReviews?: number;
  productsSold?: number;
};
