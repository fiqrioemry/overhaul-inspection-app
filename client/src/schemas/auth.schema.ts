// src/schemas/auth.schema.ts
/* eslint-disable no-useless-escape */
import { z } from "zod";
import i18n from "@/i18n";

const t = (key: string, opts?: Record<string, unknown>): string => (opts !== undefined ? i18n.t(`validation:${key}`, opts) : i18n.t(`validation:${key}`));

export const passwordValidation = () =>
  z
    .string()
    .min(10, t("passwordMin", { count: 10 }))
    .refine((p) => /[A-Z]/.test(p), { message: t("passwordUppercase") })
    .refine((p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(p), { message: t("passwordSpecialChar") });

export const loginSchema = () =>
  z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });

export const forgotPasswordSchema = () =>
  z.object({
    email: z.string().email(t("emailInvalid")),
  });

export const resetPasswordSchema = () =>
  z
    .object({
      password: z
        .string()
        .min(8, t("passwordMin", { count: 8 }))
        .regex(/[A-Z]/, t("passwordUppercase"))
        .regex(/[0-9]/, t("passwordNumber")),
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

export const twoFactorChallengeSchema = () =>
  z.object({
    code: z
      .string()
      .min(6, t("codeMin", { count: 6 }))
      .max(8, t("codeMax", { count: 8 })),
  });

export const twoFactorVerifySchema = () =>
  z.object({
    code: z.string().length(6, t("totpCodeLength")),
  });

export const twoFactorDisableSchema = () =>
  z.object({
    code: z
      .string()
      .min(6, t("codeMin", { count: 6 }))
      .max(8, t("codeMax", { count: 8 })),
  });

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>;
export type ForgotPasswordFormValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;
export type ResetPasswordFormValues = z.infer<ReturnType<typeof resetPasswordSchema>>;
export type TwoFactorChallengeFormValues = z.infer<ReturnType<typeof twoFactorChallengeSchema>>;
export type TwoFactorVerifyFormValues = z.infer<ReturnType<typeof twoFactorVerifySchema>>;
export type TwoFactorDisableFormValues = z.infer<ReturnType<typeof twoFactorDisableSchema>>;

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}
