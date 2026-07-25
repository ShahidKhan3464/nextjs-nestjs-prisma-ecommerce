import { unwrapNestDataResponsePayload } from "@/lib/nest-http";
import type {
  SellerProfile,
  SellerDocument,
  SellerDocumentType,
  SellerStoreSummary,
  SellerProfileStatus,
} from "@/modules/customer/seller-registration/types";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date(0).toISOString();
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return toIso(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

function mapStore(raw: unknown): SellerStoreSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asNumber(o.id);
  if (id == null) return null;
  if (
    typeof o.name !== "string" ||
    typeof o.slug !== "string" ||
    typeof o.status !== "string" ||
    typeof o.address !== "string" ||
    typeof o.city !== "string" ||
    typeof o.postalCode !== "string" ||
    typeof o.country !== "string"
  ) {
    return null;
  }
  return {
    id,
    name: o.name,
    slug: o.slug,
    city: o.city,
    status: o.status,
    address: o.address,
    country: o.country,
    postalCode: o.postalCode,
    createdAt: toIso(o.createdAt),
    verifiedAt: toIsoOrNull(o.verifiedAt),
    suspendedAt: toIsoOrNull(o.suspendedAt),
    description: typeof o.description === "string" ? o.description : null,
  };
}

function mapDocument(raw: unknown): SellerDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asNumber(o.id);
  const type = o.type;
  const fileRaw = o.file;
  if (id == null || typeof type !== "string" || !fileRaw || typeof fileRaw !== "object") {
    return null;
  }
  const f = fileRaw as Record<string, unknown>;
  const fileId = asNumber(f.id);
  if (
    fileId == null ||
    typeof f.originalName !== "string" ||
    typeof f.mimeType !== "string" ||
    typeof f.urlPath !== "string"
  ) {
    return null;
  }
  const fileSize = asNumber(f.fileSize) ?? 0;
  return {
    id,
    type: type as SellerDocumentType,
    file: {
      fileSize,
      id: fileId,
      urlPath: f.urlPath,
      mimeType: f.mimeType,
      originalName: f.originalName,
      createdAt: toIso(f.createdAt),
    },
  };
}

export function mapNestSellerProfile(raw: unknown): SellerProfile | null {
  const payload = unwrapNestDataResponsePayload(raw);
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  const id = asNumber(o.id);
  const userId = asNumber(o.userId);
  if (id == null || userId == null) return null;
  if (
    typeof o.businessName !== "string" ||
    typeof o.businessEmail !== "string" ||
    typeof o.businessPhone !== "string" ||
    typeof o.status !== "string"
  ) {
    return null;
  }

  const documents = Array.isArray(o.documents)
    ? o.documents
        .map(mapDocument)
        .filter((d): d is SellerDocument => d != null)
    : [];

  return {
    id,
    userId,
    businessName: o.businessName,
    businessEmail: o.businessEmail,
    businessPhone: o.businessPhone,
    taxNumber: typeof o.taxNumber === "string" ? o.taxNumber : null,
    registrationNumber:
      typeof o.registrationNumber === "string" ? o.registrationNumber : null,
    status: o.status as SellerProfileStatus,
    approvedAt: toIsoOrNull(o.approvedAt),
    rejectedReason:
      typeof o.rejectedReason === "string" ? o.rejectedReason : null,
    createdAt: toIso(o.createdAt),
    updatedAt: toIso(o.updatedAt),
    store: mapStore(o.store),
    documents,
  };
}
