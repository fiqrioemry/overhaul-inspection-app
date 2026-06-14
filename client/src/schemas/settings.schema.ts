// src/schemas/settings.schema.ts
import { z } from "zod";
import i18n from "@/i18n";
import { passwordValidation } from "./auth.schema";

const t = (key: string, opts?: Record<string, unknown>): string => (opts !== undefined ? i18n.t(`validation:${key}`, opts) : i18n.t(`validation:${key}`));

export const profileFormSchema = () =>
  z.object({
    name: z
      .string()
      .min(1, t("nameRequired"))
      .max(50, t("nameMax", { count: 50 })),
  });

export type ProfileFormValues = z.infer<ReturnType<typeof profileFormSchema>>;

export const changePasswordSchema = () =>
  z
    .object({
      currentPassword: z.string().min(1, t("currentPasswordRequired")),
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
      newPassword: passwordValidation(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("newPasswordsDoNotMatch"),
      path: ["confirmPassword"],
    });

export type ChangePasswordFormValues = z.infer<ReturnType<typeof changePasswordSchema>>;

export const setPasswordSchema = () =>
  z
    .object({
      newPassword: passwordValidation(),
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

export type SetPasswordFormValues = z.infer<ReturnType<typeof setPasswordSchema>>;
