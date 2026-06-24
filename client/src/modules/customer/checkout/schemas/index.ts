import { z } from "zod";

export const shippingSchema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().min(3),
  country: z.string().min(2),
  phone: z.string().optional(),
});

export type ShippingValues = z.infer<typeof shippingSchema>;
