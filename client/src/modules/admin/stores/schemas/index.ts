import { z } from "zod";

export const suspendStoreSchema = z.object({
  suspensionReason: z
    .string()
    .trim()
    .max(1000, "Reason must be at most 1000 characters"),
});

export type SuspendStoreFormValues = z.infer<typeof suspendStoreSchema>;
