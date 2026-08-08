import { z } from "zod";

export const recordRefundSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(255, "Reason must be at most 255 characters"),
    amount: z.string().trim().optional(),
    externalRefundId: z.string().trim().max(255).optional(),
  })
  .superRefine((values, ctx) => {
    const raw = values.amount?.trim();
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount must be at least 0.01",
        path: ["amount"],
      });
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use up to 2 decimal places",
        path: ["amount"],
      });
    }
  });

export type RecordRefundFormValues = z.infer<typeof recordRefundSchema>;

export const rejectCodSchema = z.object({
  reason: z.string().trim().max(255, "Reason must be at most 255 characters"),
});

export type RejectCodFormValues = z.infer<typeof rejectCodSchema>;
