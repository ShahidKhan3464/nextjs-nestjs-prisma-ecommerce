import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "At least 8 characters"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(8, "At least 8 characters"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
