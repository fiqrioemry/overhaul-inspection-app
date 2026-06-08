// src/features/auth/components/LoginForm.tsx
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import OAuthDivider from "./OAuthDivider";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OAuthButtonGroup from "./OAuthButtonGroup";
import { login, challenge2FA } from "@/features/auth/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { loginSchema, twoFactorChallengeSchema, type LoginFormValues, type TwoFactorChallengeFormValues } from "@/schemas/auth.schema";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginForm() {
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "common", "api"]);
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || "/";

  const oauthError = new URLSearchParams(window.location.search).get("error");
  const oauthErrorMessages: Record<string, string> = {
    oauth_failed: t("auth:oauthFailed"),
    oauth_cancelled: t("auth:oauthCancelled"),
  };

  const [serverError, setServerError] = useState<ResponseError | null>(
    oauthError ? { message: oauthErrorMessages[oauthError] ?? t("common:error"), success: false, status: 400, code: oauthError } : null,
  );

  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [challengeToken, setChallengeToken] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    register: registerChallenge,
    handleSubmit: handleChallengeSubmit,
    formState: { isSubmitting: isChallengeSubmitting, errors: challengeErrors },
    setError: setChallengeError,
    reset: resetChallenge,
  } = useForm<TwoFactorChallengeFormValues>({
    resolver: zodResolver(twoFactorChallengeSchema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const result = await login(values);
      const data = result.data;

      if (data && "requiresTwoFactor" in data && data.requiresTwoFactor) {
        setChallengeToken(data.challengeToken);
        setStep("2fa");
      } else {
        navigate(redirectTo || "/", { replace: true });
        toast.success(t("api:LOGIN_SUCCESS"));
      }
    } catch (err) {
      const res = err as ResponseError;
      const message = res?.code
        ? t(`api:${res.code}`, { defaultValue: res.message ?? t("auth:loginFailed") })
        : (res?.message ?? t("auth:loginFailed"));
      setServerError({ message, errors: res?.errors });
    }
  }

  async function onChallengeSubmit(values: TwoFactorChallengeFormValues) {
    try {
      await challenge2FA({ ...values, challengeToken });
      navigate(redirectTo || "/", { replace: true });
      toast.success(t("api:TWO_FACTOR_CHALLENGE_PASSED"));
    } catch (err) {
      const res = err as ResponseError;
      const message = res?.code
        ? t(`api:${res.code}`, { defaultValue: res?.message })
        : (res?.message ?? t("api:UNKNOWN_ERROR"));
      setChallengeError("code", { message });
    }
  }

  if (step === "2fa") {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Two-Factor Auth</h1>
          </div>
          <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app, or use one of your backup codes.</p>
        </div>

        <form onSubmit={handleChallengeSubmit(onChallengeSubmit)} className="space-y-4">
          <Field data-invalid={!!challengeErrors.code}>
            <FieldLabel>Authentication Code</FieldLabel>
            <Input
              {...registerChallenge("code")}
              placeholder="000000"
              maxLength={8}
              className="font-mono tracking-widest text-center text-lg"
              autoFocus
              autoComplete="one-time-code"
            />
            <FieldError errors={[challengeErrors.code]} />
          </Field>

          <Button type="submit" className="w-full" disabled={isChallengeSubmitting}>
            {isChallengeSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Verify
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setChallengeToken("");
              resetChallenge();
            }}
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
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
