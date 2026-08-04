import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";
import type {
  AddressInput,
  SetDefaultAddressInput,
  UserAddress,
} from "../types";

export async function fetchAddresses() {
  const res = await api.get<ApiResponse<{ addresses: UserAddress[] }>>(
    "/api/v1/customer/addresses"
  );
  return res.data.data.addresses;
}

export async function createAddress(body: AddressInput) {
  const res = await api.post<ApiResponse<{ address: UserAddress }>>(
    "/api/v1/customer/addresses",
    body
  );
  return res.data.data.address;
}

export async function updateAddress(id: string, body: Partial<AddressInput>) {
  const res = await api.patch<ApiResponse<{ address: UserAddress }>>(
    `/api/v1/customer/addresses/${encodeURIComponent(id)}`,
    body
  );
  return res.data.data.address;
}

export async function deleteAddress(id: string) {
  await api.delete(`/api/v1/customer/addresses/${encodeURIComponent(id)}`);
}

export async function setDefaultAddress(
  id: string,
  body: SetDefaultAddressInput
) {
  const res = await api.patch<ApiResponse<{ address: UserAddress }>>(
    `/api/v1/customer/addresses/${encodeURIComponent(id)}/default`,
    body
  );
  return res.data.data.address;
}
