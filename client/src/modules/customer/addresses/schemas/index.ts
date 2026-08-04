import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().max(100).optional().or(z.literal("")),
  fullName: z.string().min(2, "Full name is required").max(100),
  line1: z.string().min(1, "Address line 1 is required").max(255),
  line2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  region: z.string().min(1, "Region is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
