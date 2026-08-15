import type {
  SellerProfile,
  SellerProfileStatus,
} from "@/modules/buyer/seller-registration/types";

export type {
  SellerProfile,
  SellerDocument,
  SellerDocumentType,
  SellerStoreSummary,
  SellerProfileStatus,
} from "@/modules/buyer/seller-registration/types";

export type ApproveSellerProfileInput = {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  storeName?: string;
  description?: string;
};

export type RejectSellerProfileInput = {
  rejectedReason: string;
};

export type SuspendSellerProfileInput = {
  suspensionReason?: string;
};

export type SellerProfileAction =
  | { type: "approve"; profile: SellerProfile }
  | { type: "reject"; profile: SellerProfile }
  | { type: "suspend"; profile: SellerProfile };

export type SellerProfileStatusFilter = SellerProfileStatus | "ALL";
