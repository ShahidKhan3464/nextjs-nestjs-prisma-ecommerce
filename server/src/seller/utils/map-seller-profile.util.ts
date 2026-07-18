import { StoreStatus } from 'src/store/constants/store.constants';
import { SellerProfileStatus } from '../constants/seller.constants';
import { seller_document_type_enum } from 'src/generated/prisma/client';
import { buildSecureFileUrlPath } from 'src/files/constants/file.constants';

export type SellerDocumentFile = {
  id: number;
  urlPath: string;
  createdAt: Date;
  mimeType: string;
  fileSize: number;
  originalName: string;
};

export type SellerDocumentMapped = {
  id: number;
  file: SellerDocumentFile;
  type: seller_document_type_enum;
};

export type SellerStoreSummary = {
  id: number;
  name: string;
  city: string;
  slug: string;
  country: string;
  address: string;
  createdAt: Date;
  postalCode: string;
  status: StoreStatus;
  verifiedAt: Date | null;
  suspendedAt: Date | null;
  description: string | null;
};

export type SellerProfileMapped = {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  approvedAt: Date | null;
  taxNumber: string | null;
  status: SellerProfileStatus;
  rejectedReason: string | null;
  store: SellerStoreSummary | null;
  registrationNumber: string | null;
  documents: SellerDocumentMapped[];
};

type ProfileSource = {
  id: number;
  userId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  approvedAt: Date | null;
  taxNumber: string | null;
  rejectedReason: string | null;
  registrationNumber: string | null;
  store?: {
    id: number;
    name: string;
    slug: string;
    city: string;
    status: string;
    address: string;
    country: string;
    createdAt: Date;
    postalCode: string;
    verifiedAt: Date | null;
    suspendedAt: Date | null;
    description: string | null;
  } | null;
  sellerDocuments?: Array<{
    id: number;
    type: seller_document_type_enum;
    file: SellerDocumentFile;
  }>;
};

export function mapSellerProfileToResponse(
  profile: ProfileSource,
): SellerProfileMapped {
  return {
    id: profile.id,
    userId: profile.userId,
    updatedAt: profile.updatedAt,
    createdAt: profile.createdAt,
    taxNumber: profile.taxNumber,
    approvedAt: profile.approvedAt,
    businessName: profile.businessName,
    businessEmail: profile.businessEmail,
    businessPhone: profile.businessPhone,
    rejectedReason: profile.rejectedReason,
    status: profile.status as SellerProfileStatus,
    registrationNumber: profile.registrationNumber,
    store: profile.store
      ? {
          id: profile.store.id,
          name: profile.store.name,
          slug: profile.store.slug,
          city: profile.store.city,
          address: profile.store.address,
          country: profile.store.country,
          createdAt: profile.store.createdAt,
          verifiedAt: profile.store.verifiedAt,
          postalCode: profile.store.postalCode,
          description: profile.store.description,
          suspendedAt: profile.store.suspendedAt,
          status: profile.store.status as StoreStatus,
        }
      : null,
    documents: (profile.sellerDocuments ?? []).map((doc) => ({
      id: doc.id,
      type: doc.type,
      file: {
        id: doc.file.id,
        urlPath: buildSecureFileUrlPath(doc.file.id),
        fileSize: doc.file.fileSize,
        mimeType: doc.file.mimeType,
        createdAt: doc.file.createdAt,
        originalName: doc.file.originalName,
      },
    })),
  };
}
