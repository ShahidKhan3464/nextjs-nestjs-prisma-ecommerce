import { z } from "zod";

export const approveSellerProfileSchema = z.object({
  storeName: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value.length === 0 || value.length >= 2, {
      message: "Store name must be at least 2 characters",
    }),
  description: z.string().trim().max(2000),
  address: z
    .string()
    .trim()
    .min(2, "Address must be at least 2 characters")
    .max(255),
  city: z.string().trim().min(1, "City is required").max(100),
  postalCode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z
    .string()
    .trim()
    .min(2, "Country must be at least 2 characters")
    .max(100),
});

export type ApproveSellerProfileValues = z.infer<
  typeof approveSellerProfileSchema
>;

export const rejectSellerProfileSchema = z.object({
  rejectedReason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(1000, "Reason must be at most 1000 characters"),
});

export type RejectSellerProfileValues = z.infer<
  typeof rejectSellerProfileSchema
>;

export const suspendSellerProfileSchema = z.object({
  suspensionReason: z
    .string()
    .trim()
    .max(1000, "Reason must be at most 1000 characters"),
});

export type SuspendSellerProfileValues = z.infer<
  typeof suspendSellerProfileSchema
>;
