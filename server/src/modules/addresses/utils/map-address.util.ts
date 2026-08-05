import type { AddressResponse } from '../types/address.types';

export type { AddressResponse } from '../types/address.types';

type AddressRow = {
  id: number;
  city: string;
  line1: string;
  userId: number;
  region: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  postalCode: string;
  line2: string | null;
  label: string | null;
  phone: string | null;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
};

export function mapAddressToResponse(row: AddressRow): AddressResponse {
  return {
    id: String(row.id),
    city: row.city,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    phone: row.phone,
    region: row.region,
    country: row.country,
    fullName: row.fullName,
    userId: String(row.userId),
    postalCode: row.postalCode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isDefaultBilling: row.isDefaultBilling,
    isDefaultShipping: row.isDefaultShipping,
  };
}
