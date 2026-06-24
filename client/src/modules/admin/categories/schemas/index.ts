import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export type CategoryValues = z.infer<typeof categorySchema>;
