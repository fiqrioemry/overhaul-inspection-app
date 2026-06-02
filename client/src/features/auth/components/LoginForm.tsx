// src/features/auth/components/LoginForm.tsx
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import OAuthDivider from "./OAuthDivider";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import OAuthButtonGroup from "./OAuthButtonGroup";
import { login } from "@/features/auth/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

export default function LoginForm() {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "common"]);
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || "/";

  const oauthError = new URLSearchParams(window.location.search).get("error");
  const oauthErrorMessages: Record<string, string> = {
    oauth_failed: t("auth:oauthFailed"),
    oauth_cancelled: t("auth:oauthCancelled"),
  };

  const [serverError, setServerError] = useState<ResponseError | null>(oauthError ? { message: oauthErrorMessages[oauthError] ?? t("common:error"), success: false, status: 400, code: oauthError } : null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const result = await login(values);
      navigate(redirectTo || "/", { replace: true });
      toast.success(result?.message);
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? t("auth:loginFailed"),
        errors: res?.errors,
      });
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("auth:loginTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth:loginSubtitle")}</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="email" label={t("auth:email")} type="email" placeholder={t("auth:emailPlaceholder")} autoComplete="email" />
        <PasswordField control={control} name="password" label={t("auth:password")} placeholder={t("auth:passwordPlaceholder")} autoComplete="current-password" />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4">
            {t("auth:forgotPassword")}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth:loggingIn") : t("auth:loginButton")}
        </Button>
      </form>

      <OAuthDivider label={t("auth:orLoginWith")} />
      <OAuthButtonGroup disabled={isSubmitting} />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t("auth:noAccount")}{" "}
          <Link to="/register" className="underline underline-offset-4">
            {t("auth:register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
