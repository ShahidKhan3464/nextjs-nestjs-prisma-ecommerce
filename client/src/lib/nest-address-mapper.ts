import type { UserAddress } from "@/modules/buyer/addresses/types";

export type NestAddressPayload = {
  id: string | number;
  userId: string | number;
  label?: string | null;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
};

export function normalizeNestAddressPayload(
  row: NestAddressPayload
): UserAddress {
  return {
    id: String(row.id),
    userId: String(row.userId),
    label: row.label ?? null,
    fullName: row.fullName,
    line1: row.line1,
    line2: row.line2 ?? null,
    city: row.city,
    region: row.region,
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone ?? null,
    isDefaultShipping: Boolean(row.isDefaultShipping),
    isDefaultBilling: Boolean(row.isDefaultBilling),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
