// src/features/auth/components/RegisterForm.tsx
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import OAuthDivider from "./OAuthDivider";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import OAuthButtonGroup from "./OAuthButtonGroup";
import { register } from "@/features/auth/auth.api";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";

export default function RegisterForm() {
  const { t } = useTranslation(["auth", "api"]);
  const [serverError, setServerError] = useState<ResponseError | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema()),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await register(values);
      toast.success(t("api:REGISTER_SUCCESS"));
      setRegisteredEmail(values.email);
    } catch (err) {
      const res = err as ResponseError;
      const message = res?.code
        ? t(`api:${res.code}`, { defaultValue: res.message ?? t("auth:registerFailed") })
        : (res?.message ?? t("auth:registerFailed"));
      setServerError({ message, errors: res?.errors });
    }
  }

  if (registeredEmail) {
    return (
      <div className="w-full max-w-sm space-y-6">
        {/* Success icon */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("auth:verifyEmailTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("auth:verifyEmailSubtitle")}</p>
          </div>
        </div>

        {/* Email badge */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
          <Mail className="size-4 shrink-0 text-zinc-400" />
          <span className="truncate text-sm font-medium text-zinc-700">{registeredEmail}</span>
        </div>

        {/* Hint */}
        <p className="text-center text-xs text-muted-foreground">{t("auth:verifyEmailHint")}</p>

        {/* CTA */}
        <Button asChild className="w-full gap-2">
          <Link to="/login">
            {t("auth:goToLogin")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        {/* Back to register */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("auth:wrongEmail")}{" "}
            <button type="button" onClick={() => setRegisteredEmail(null)} className="underline underline-offset-4 hover:text-foreground">
              {t("auth:tryAgain")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("auth:registerTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth:registerSubtitle")}</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      {/* Register form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="name" label={t("auth:name")} placeholder={t("auth:namePlaceholder")} autoComplete="name" />
        <ShortTextField control={control} name="email" label={t("auth:email")} type="email" placeholder={t("auth:emailPlaceholder")} autoComplete="email" />
        <PasswordField control={control} name="password" label={t("auth:password")} placeholder={t("auth:passwordPlaceholder")} autoComplete="new-password" />
        <PasswordField control={control} name="confirmPassword" label={t("auth:confirmPassword")} placeholder={t("auth:passwordPlaceholder")} autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth:registering") : t("auth:registerButton")}
        </Button>
      </form>

      {/* OAuth section */}
      <OAuthDivider label={t("auth:orRegisterWith")} />
      <OAuthButtonGroup disabled={isSubmitting} />

      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t("auth:haveAccount")}{" "}
          <Link to="/login" className="underline underline-offset-4">
            {t("auth:login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
