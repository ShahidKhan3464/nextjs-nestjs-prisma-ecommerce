import { z } from "zod";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const sellerVariantSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(255),
  color: z.string().trim().min(1, "Color is required").max(255),
  sku: z.string().trim().min(2, "SKU must be at least 2 characters").max(255),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  price: z.coerce.number().positive("Price must be greater than 0"),
});

export type SellerVariantValues = z.infer<typeof sellerVariantSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  description: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || v.trim().length >= 10, {
      message: "Description must be at least 10 characters when provided",
    })
    .refine((v) => !v || v.length <= 1000, {
      message: "Description must be at most 1000 characters",
    }),
  categoryId: z.string().min(1, "Pick a category"),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
  variants: z.array(sellerVariantSchema).min(1, "Add at least one variant"),
});

export type ProductValues = z.infer<typeof productSchema>;

export const productImageFileSchema = z
  .custom<File>((v) => typeof File !== "undefined" && v instanceof File, {
    message: "Invalid file",
  })
  .refine((f) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type), {
    message: "Use JPEG, PNG, GIF, or WebP",
  })
  .refine((f) => f.size <= MAX_IMAGE_BYTES, {
    message: "Each image must be 5 MB or smaller",
  });

export const productImagesSchema = z
  .array(productImageFileSchema)
  .min(1, "Add at least one product image")
  .max(12, "You can upload at most 12 images");
