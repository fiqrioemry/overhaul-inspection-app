// src/schemas/auth.schema.ts
/* eslint-disable no-useless-escape */
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email is not valid"),
  password: z.string().min(1, "Password  is required"),
});

export const passwordValidation = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password), {
    message: "Password must contain at least one special character",
  });

export const registerSchema = z
  .object({
    name: z.string().min(3, "Name required min 3 Characters"),
    email: z.email("Invalid email address"),
    password: passwordValidation,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter").regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf kapital").regex(/[0-9]/, "Password harus mengandung minimal 1 angka"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export const twoFactorChallengeSchema = z.object({
  code: z.string().min(6, "Code must be at least 6 characters").max(8, "Code must be at most 8 characters"),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, "TOTP code must be exactly 6 digits"),
});

export const twoFactorDisableSchema = z.object({
  code: z.string().min(6, "Code must be at least 6 characters").max(8, "Code must be at most 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type TwoFactorChallengeFormValues = z.infer<typeof twoFactorChallengeSchema>;
export type TwoFactorVerifyFormValues = z.infer<typeof twoFactorVerifySchema>;
export type TwoFactorDisableFormValues = z.infer<typeof twoFactorDisableSchema>;
