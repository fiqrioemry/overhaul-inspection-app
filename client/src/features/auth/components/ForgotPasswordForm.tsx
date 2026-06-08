import React from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MailCheck, ArrowLeft } from "lucide-react";
import { ShortTextField } from "@/components/fields";
import AlertCard from "@/components/common/AlertCard";
import { forgotPassword } from "@/features/auth/auth.api";
import type { ResponseError } from "@/types/response.type";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/auth.schema";

export default function ForgotPasswordForm() {
  const { t } = useTranslation(["auth"]);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema()),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);

    try {
      const result = await forgotPassword(values);
      setSuccess(result.message);
      toast.success(result?.message || "Password reset instructions sent successfully.");
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? "Password reset failed, please try again",
        errors: res?.errors,
      });
    }
  }

  // Success State
  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border bg-background p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <MailCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("auth:checkYourEmail")}</h1>
            <p className="text-sm text-muted-foreground leading-6">{t("auth:passwordResetInstructionsSent")}</p>
            <p className="font-medium text-foreground break-all">{getValues("email")}</p>
          </div>

          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground text-left leading-6">{t("auth:checkSpamFolder")}</div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/login">{t("auth:backToSignIn")}</Link>
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => setSuccess(null)}>
              {t("auth:resendEmail")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default Form State
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">{t("auth:forgotPasswordTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auth:enterEmailForResetInstructions")}</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="email" label={t("auth:email")} type="email" placeholder={t("auth:emailPlaceholder")} autoComplete="email" />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth:sending") : t("auth:sendResetInstructions")}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t("auth:rememberYourAccount")}{" "}
          <Link to="/login" className="inline-flex items-center gap-1 underline underline-offset-4">
            <ArrowLeft className="h-3 w-3" />
            {t("auth:signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
