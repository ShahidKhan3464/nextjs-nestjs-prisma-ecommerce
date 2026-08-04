import { z } from "zod";

const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(255),
  color: z.string().trim().min(1, "Color is required").max(255),
  sku: z.string().trim().min(2).max(255),
  stock: z.coerce.number().int().min(0),
  price: z.coerce.number().positive(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(255),
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
  variants: z.array(variantSchema).min(1),
});

export type ProductValues = z.infer<typeof productSchema>;
