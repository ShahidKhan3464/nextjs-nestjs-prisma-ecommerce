import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number({ error: "Rating is required" })
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  title: z.string().max(255).optional().or(z.literal("")),
  comment: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || v.trim().length === 0 || v.trim().length >= 10,
      "Comment must be at least 10 characters"
    ),
});

export const updateReviewSchema = createReviewSchema;

export type ReviewFormValues = z.infer<typeof createReviewSchema>;
