import type { SellerProfileStatus } from "../types";

export const SELLER_STATUS_FILTER_OPTIONS: Array<{
  value: "ALL" | SellerProfileStatus;
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: "Business license",
  TAX_DOCUMENT: "Tax document",
};

export function sellerDocumentDownloadUrl(
  fileId: number,
  options?: { inline?: boolean }
): string {
  const base = `/api/v1/admin/files/secure/${fileId}`;
  return options?.inline ? `${base}?inline=1` : base;
}
