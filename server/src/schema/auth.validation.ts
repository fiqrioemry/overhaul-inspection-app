import { z } from "zod";

export const userResponse = z.object({
  id: z.cuid(),
  email: z.email(),
  name: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
  lastLogin: z.date().nullable(),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponse>;

export const userCredential = z.object({
  id: z.cuid(),
  email: z.email(),
  passwordHash: z.string(),
});

export type UserCredential = z.infer<typeof userCredential>;

export const registerRequest = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterRequest = z.infer<typeof registerRequest>;

export const resetPasswordRequest = z
  .object({
    token: z.uuid("Invalid token"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequest>;

export const changePasswordRequest = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
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

export type ResendVerificationEmailRequest = z.infer<typeof resendVerificationEmailRequest>;

export type CreateUserData = {
  email: string;
  passwordHash: string;
  name: string;
  username: string;
  avatar: string;
};
