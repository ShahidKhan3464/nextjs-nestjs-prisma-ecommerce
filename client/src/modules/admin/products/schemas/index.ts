import { z } from "zod";

const variantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  sku: z.string().min(2),
  stock: z.coerce.number().int().min(0),
  price: z.coerce.number().positive(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || v.trim().length >= 10, {
      message: "Description must be at least 10 characters when provided",
    }),
  categoryId: z.string().min(1, "Pick a category"),
  variants: z.array(variantSchema).min(1),
});

export type ProductValues = z.infer<typeof productSchema>;
