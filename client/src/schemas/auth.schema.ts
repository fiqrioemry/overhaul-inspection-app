/* eslint-disable no-useless-escape */
// auth.schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email is not valid"),
  password: z.string().min(1, "Password  is required"),
});

const passwordValidation = z
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
    name: z.string().min(10, "Name is required"),
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

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
