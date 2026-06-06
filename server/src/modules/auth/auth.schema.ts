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
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
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

export const googleCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State is required"),
});

export type GoogleCallbackRequest = z.infer<typeof googleCallbackSchema>;

export const twoFactorCodeRequest = z.object({
  code: z.string().min(6, "Code is required"),
});
export type TwoFactorCodeRequest = z.infer<typeof twoFactorCodeRequest>;

export const twoFactorChallengeRequest = z.object({
  challengeToken: z.string().min(1, "Challenge token is required"),
  code: z.string().min(6, "Code is required"),
});
export type TwoFactorChallengeRequest = z.infer<typeof twoFactorChallengeRequest>;
