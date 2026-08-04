export type AddressResponse = {
  id: string;
  userId: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
};

type AddressRow = {
  id: number;
  userId: number;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
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
