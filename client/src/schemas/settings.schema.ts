// src/features/settings/settings.schema.ts
import { z } from "zod";
import { passwordValidation } from "./auth.schema";

export const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be at most 50 characters"),
  bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
    newPassword: passwordValidation,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
