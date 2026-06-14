// src/features/auth/components/LoginForm.tsx
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { login } from "@/features/auth/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import { ROUTES } from "@/constants/route.constant";

export default function LoginForm() {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "api"]);
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || ROUTES.DASHBOARD;
  const [serverError, setServerError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema()),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
      toast.success(t("api:LOGIN_SUCCESS"));
    } catch (err) {
      const res = err as ResponseError;
      const message = res?.code
        ? t(`api:${res.code}`, { defaultValue: res.message ?? t("auth:loginFailed") })
        : (res?.message ?? t("auth:loginFailed"));
      setServerError({ message, errors: res?.errors });
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
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-muted-foreground underline underline-offset-4">
            {t("auth:forgotPassword")}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth:loggingIn") : t("auth:loginButton")}
        </Button>
      </form>
    </div>
  );
}
