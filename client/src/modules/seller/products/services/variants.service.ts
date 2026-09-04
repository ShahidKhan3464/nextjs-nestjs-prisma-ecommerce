import { api } from "@/services/api/client";
import type {
  SellerProductVariant,
  SellerVariantListParams,
  SellerVariantListResult,
  CreateSellerVariantInput,
  UpdateSellerVariantInput,
} from "../types";

export async function fetchSellerVariants(
  params?: SellerVariantListParams
): Promise<SellerVariantListResult> {
  const res = await api.get<{ data: SellerVariantListResult }>(
    "/api/v1/seller/product-variants",
    { params }
  );
  return res.data.data;
}

export async function createSellerVariant(
  payload: CreateSellerVariantInput
): Promise<SellerProductVariant> {
  const res = await api.post<{ data: { variant: SellerProductVariant } }>(
    "/api/v1/seller/product-variants",
    payload
  );
  return res.data.data.variant;
}

export async function updateSellerVariant(
  id: string,
  payload: UpdateSellerVariantInput
): Promise<SellerProductVariant> {
  const res = await api.patch<{ data: { variant: SellerProductVariant } }>(
    `/api/v1/seller/product-variants/${id}`,
    payload
  );
  return res.data.data.variant;
}

export async function deleteSellerVariant(id: string): Promise<void> {
  await api.delete(`/api/v1/seller/product-variants/${id}`);
}
