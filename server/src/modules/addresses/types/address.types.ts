export type AddressResponse = {
  id: string;
  city: string;
  line1: string;
  userId: string;
  region: string;
  country: string;
  fullName: string;
  updatedAt: string;
  createdAt: string;
  postalCode: string;
  label: string | null;
  line2: string | null;
  phone: string | null;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
};
