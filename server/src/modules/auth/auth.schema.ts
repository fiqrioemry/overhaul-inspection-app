import { z } from "zod";

const passwordValidation = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), {
    message: "Password must contain at least one special character",
  });

export const registerRequest = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: passwordValidation,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterRequest = z.infer<typeof registerRequest>;

export const resetPasswordRequest = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequest>;

export const changePasswordRequest = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
    newPassword: passwordValidation,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordRequest>;

export const loginRequest = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "password is required"),
});

export type LoginRequest = z.infer<typeof loginRequest>;

export const resendVerificationEmailRequest = z.object({
  email: z.email("Invalid email address"),
});

export const forgotPasswordRequest = z.object({
  email: z.email("Invalid email address"),
});
