import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(30, "Password is too long")
  .regex(
    PASSWORD_PATTERN,
    "Include upper & lowercase, a number, and a special character (@$!%*?&)"
  );

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(5, "Name is too short")
      .max(30, "Name is too long"),
    phoneNumber: z.string().max(20).optional(),
    email: z.string().email("Enter a valid email"),
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
