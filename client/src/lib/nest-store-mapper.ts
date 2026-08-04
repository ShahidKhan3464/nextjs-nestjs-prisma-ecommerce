import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import { unwrapNestDataResponsePayload } from "@/lib/nest-http";
import { STORE_FILE_TYPES, STORE_STATUSES } from "@/modules/seller/store/types";
import type {
  Store,
  StoreFile,
  StoreStatus,
  StoreFileType,
  StoreSellerProfile,
} from "@/modules/seller/store/types";

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

function isStoreStatus(value: string): value is StoreStatus {
  return (STORE_STATUSES as readonly string[]).includes(value);
}

function isStoreFileType(value: string): value is StoreFileType {
  return (STORE_FILE_TYPES as readonly string[]).includes(value);
}

function mapSellerProfile(raw: unknown): StoreSellerProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asNumber(o.id);
  const userId = asNumber(o.userId);
  if (
    id == null ||
    userId == null ||
    typeof o.status !== "string" ||
    typeof o.businessName !== "string"
  ) {
    return null;
  }
  return {
    id,
    userId,
    status: o.status,
    businessName: o.businessName,
  };
}

function mapStoreFile(raw: unknown): StoreFile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asNumber(o.id);
  const sortOrder = asNumber(o.sortOrder) ?? 0;
  const type = o.type;
  const fileRaw = o.file;
  if (
    id == null ||
    typeof type !== "string" ||
    !isStoreFileType(type) ||
    !fileRaw ||
    typeof fileRaw !== "object"
  ) {
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
  const resolved = resolveUploadUrl(f.urlPath) ?? f.urlPath;
  return {
    id,
    type,
    sortOrder,
    file: {
      id: fileId,
      urlPath: resolved,
      mimeType: f.mimeType,
      originalName: f.originalName,
      createdAt: toIso(f.createdAt),
      fileSize: asNumber(f.fileSize) ?? 0,
    },
  };
}

export function mapNestStore(raw: unknown): Store | null {
  const payload = unwrapNestDataResponsePayload(raw);
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;

  const id = asNumber(o.id);
  const sellerProfileId = asNumber(o.sellerProfileId);
  if (id == null || sellerProfileId == null) return null;

  if (
    typeof o.name !== "string" ||
    typeof o.slug !== "string" ||
    typeof o.status !== "string" ||
    !isStoreStatus(o.status) ||
    typeof o.address !== "string" ||
    typeof o.city !== "string" ||
    typeof o.postalCode !== "string" ||
    typeof o.country !== "string"
  ) {
    return null;
  }

  const sellerProfile = mapSellerProfile(o.sellerProfile);
  if (!sellerProfile) return null;

  const files = Array.isArray(o.files)
    ? o.files.map(mapStoreFile).filter((f): f is StoreFile => f != null)
    : [];

  const averageRating =
    typeof o.averageRating === "number" && Number.isFinite(o.averageRating)
      ? o.averageRating
      : undefined;
  const totalReviews =
    typeof o.totalReviews === "number" && Number.isFinite(o.totalReviews)
      ? o.totalReviews
      : undefined;
  const productsSold =
    typeof o.productsSold === "number" && Number.isFinite(o.productsSold)
      ? o.productsSold
      : undefined;

  return {
    id,
    sellerProfileId,
    name: o.name,
    slug: o.slug,
    status: o.status,
    address: o.address,
    city: o.city,
    postalCode: o.postalCode,
    country: o.country,
    description: typeof o.description === "string" ? o.description : null,
    verifiedAt: toIsoOrNull(o.verifiedAt),
    suspendedAt: toIsoOrNull(o.suspendedAt),
    suspensionReason:
      typeof o.suspensionReason === "string" ? o.suspensionReason : null,
    createdAt: toIso(o.createdAt),
    updatedAt: toIso(o.updatedAt),
    sellerProfile,
    files,
    ...(averageRating !== undefined ? { averageRating } : {}),
    ...(totalReviews !== undefined ? { totalReviews } : {}),
    ...(productsSold !== undefined ? { productsSold } : {}),
  };
}
