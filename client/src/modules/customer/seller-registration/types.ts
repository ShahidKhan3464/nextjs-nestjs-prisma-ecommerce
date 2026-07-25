export const SELLER_PROFILE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export type SellerProfileStatus = (typeof SELLER_PROFILE_STATUSES)[number];

export const SELLER_DOCUMENT_TYPES = [
  "TAX_DOCUMENT",
  "BUSINESS_LICENSE",
] as const;

export type SellerDocumentType = (typeof SELLER_DOCUMENT_TYPES)[number];

export type SellerDocumentFile = {
  id: number;
  urlPath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  originalName: string;
};

export type SellerDocument = {
  id: number;
  type: SellerDocumentType;
  file: SellerDocumentFile;
};

export type SellerStoreSummary = {
  id: number;
  name: string;
  slug: string;
  city: string;
  status: string;
  address: string;
  country: string;
  createdAt: string;
  postalCode: string;
  verifiedAt: string | null;
  description: string | null;
  suspendedAt: string | null;
};

export type SellerProfile = {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  taxNumber: string | null;
  approvedAt: string | null;
  status: SellerProfileStatus;
  documents: SellerDocument[];
  rejectedReason: string | null;
  store: SellerStoreSummary | null;
  registrationNumber: string | null;
};

export type CreateSellerProfileInput = {
  taxNumber?: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  registrationNumber?: string;
};

export type UpdateSellerProfileInput = Partial<CreateSellerProfileInput>;
