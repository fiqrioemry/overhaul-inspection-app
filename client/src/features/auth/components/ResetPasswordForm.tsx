// src/features/auth/components/ResetPasswordForm.tsx
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth.schema";
import { useResetPassword } from "@/features/auth/auth.query";
import { ROUTES } from "@/constants/route.constant";
import { useState } from "react";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation(["auth", "api"]);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<ResponseError | null>(null);
  const resetMutation = useResetPassword(token);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema()),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    try {
      await resetMutation.mutateAsync(values);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const res = err as ResponseError;
      setServerError({ message: res?.message ?? "Reset failed, please try again.", errors: res?.errors });
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("auth:resetPasswordTitle", { defaultValue: "Set new password" })}</h1>
        <p className="text-sm text-muted-foreground">
          {t("auth:resetPasswordSubtitle", { defaultValue: "Enter your new password below." })}
        </p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          control={control}
          name="password"
          label={t("auth:password")}
          placeholder={t("auth:passwordPlaceholder")}
          autoComplete="new-password"
        />
        <PasswordField
          control={control}
          name="confirmPassword"
          label={t("auth:confirmPassword")}
          placeholder={t("auth:passwordPlaceholder")}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || resetMutation.isPending}>
          {isSubmitting || resetMutation.isPending ? "Saving..." : "Set new password"}
        </Button>
      </form>

      <div className="text-center">
        <Link to={ROUTES.LOGIN} className="text-sm text-muted-foreground underline underline-offset-4">
          {t("auth:backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
