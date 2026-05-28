// src/features/auth/components/RegisterForm.tsx
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import OAuthDivider from "./OAuthDivider";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import OAuthButtonGroup from "./OAuthButtonGroup";
import { register } from "@/features/auth/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";

export default function RegisterForm() {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth"]);
  const [serverError, setServerError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const result = await register(values);
      toast.success(result?.message || t("auth:registerSuccess"));
      navigate("/login", { replace: true });
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? t("auth:registerFailed"),
        errors: res?.errors,
      });
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 border p-6 rounded-lg">
      {/* Header */}
      <div className="space-y-1 text-center">
        <div>✨</div>
        <h1 className="text-2xl font-semibold">{t("auth:registerTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth:registerSubtitle")}</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      {/* Register form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="name" label={t("auth:name")} placeholder={t("auth:namePlaceholder")} autoComplete="name" />
        <ShortTextField control={control} name="email" label={t("auth:email")} type="email" placeholder={t("auth:emailPlaceholder")} autoComplete="email" />
        <PasswordField control={control} name="password" label={t("auth:password")} placeholder={t("auth:passwordPlaceholder")} autoComplete="new-password" />
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
