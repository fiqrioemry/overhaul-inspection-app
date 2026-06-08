// src/schemas/settings.schema.ts
import { z } from "zod";
import i18n from "@/i18n";
import { passwordValidation } from "./auth.schema";

const t = (key: string, opts?: Record<string, unknown>): string =>
  opts !== undefined ? i18n.t(`validation:${key}`, opts) : i18n.t(`validation:${key}`);

export const profileFormSchema = () =>
  z.object({
    name: z.string().min(1, t("nameRequired")).max(50, t("nameMax", { count: 50 })),
    bio: z.string().max(160, t("bioMax", { count: 160 })).optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    website: z
      .string()
      .max(200, t("websiteMax", { count: 200 }))
      .refine((v) => !v || /^https?:\/\/.+/.test(v), { message: t("websiteInvalid") })
      .optional(),
    username: z
      .string()
      .min(3, t("usernameMin", { count: 3 }))
      .max(30, t("usernameMax", { count: 30 }))
      .regex(/^[a-z0-9_.]+$/, t("usernamePattern")),
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
