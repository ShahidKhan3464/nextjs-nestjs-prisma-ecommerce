import { z } from "zod";
import { SELLER_DOCUMENT_TYPES } from "../types";

const PHONE_MIN = 7;
const PHONE_MAX = 30;
const PHONE_REGEX = /^[+\d][\d\s()-]{6,29}$/;
const ID_NUMBER_REGEX = /^[A-Za-z0-9\-./]+$/;

const optionalIdNumber = z
  .string()
  .trim()
  .max(50, "Must be 50 characters or fewer")
  .refine((value) => value === "" || ID_NUMBER_REGEX.test(value), {
    message: "Only letters, numbers, and - . / are allowed",
  });

export const sellerApplicationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name is required")
    .max(255, "Business name is too long"),
  businessEmail: z
    .string()
    .trim()
    .email("Enter a valid business email")
    .max(255, "Email is too long"),
  businessPhone: z
    .string()
    .trim()
    .min(PHONE_MIN, "Phone number is too short")
    .max(PHONE_MAX, "Phone number is too long")
    .regex(PHONE_REGEX, "Enter a valid phone number"),
  taxNumber: optionalIdNumber,
  registrationNumber: optionalIdNumber,
});

export const sellerDocumentUploadSchema = z.object({
  type: z.enum(SELLER_DOCUMENT_TYPES),
  file: z
    .instanceof(File, { error: "Choose a file to upload" })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File must be 10MB or smaller"
    )
    .refine(
      (file) =>
        /^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/i.test(file.type),
      "Only PDF, JPEG, PNG, or WebP files are allowed"
    ),
});

export type SellerApplicationValues = z.infer<typeof sellerApplicationSchema>;
export type SellerDocumentUploadValues = z.infer<
  typeof sellerDocumentUploadSchema
>;
