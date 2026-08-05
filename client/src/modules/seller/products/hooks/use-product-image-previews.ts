"use client";

import { previewKey } from "../utils/product-form";
import { useProductImageFilePreviews as useSharedPreviews } from "@/shared/hooks/use-product-image-previews";

export function useProductImageFilePreviews() {
  return useSharedPreviews(previewKey);
}
