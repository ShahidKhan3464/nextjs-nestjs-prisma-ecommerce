import { z } from "zod";

export const updateStoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be at most 255 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters"),
  address: z
    .string()
    .trim()
    .min(2, "Address must be at least 2 characters")
    .max(255, "Address must be at most 255 characters"),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City must be at most 100 characters"),
  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .max(20, "Postal code must be at most 20 characters"),
  country: z
    .string()
    .trim()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must be at most 100 characters"),
});

export type UpdateStoreValues = z.infer<typeof updateStoreSchema>;
