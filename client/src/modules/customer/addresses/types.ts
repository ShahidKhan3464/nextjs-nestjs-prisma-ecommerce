export type UserAddress = {
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

export type AddressInput = {
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type SetDefaultAddressInput = {
  shipping?: boolean;
  billing?: boolean;
};
