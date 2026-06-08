// src/features/settings/components/TwoFactorSetup.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, ShieldCheck, ShieldOff, Copy, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { setup2FA } from "@/features/auth/auth.api";
import { useVerify2FA, useDisable2FA } from "@/features/auth/auth.query";
import { twoFactorVerifySchema, twoFactorDisableSchema, type TwoFactorVerifyFormValues, type TwoFactorDisableFormValues } from "@/schemas/auth.schema";
import type { TwoFactorSetupData } from "@/types/users.type";
import type { UserAccount } from "@/types/users.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Step = "idle" | "setup" | "verify" | "backupCodes" | "disable";

export default function TwoFactorSetup() {
  const { t } = useTranslation(["setting"]);
  const { user } = useAuthStore();
  const userAccount = user as UserAccount | null;
  const twoFactorEnabled = userAccount?.twoFactorEnabled ?? false;

  const [step, setStep] = useState<Step>("idle");
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const { mutateAsync: verify, isPending: isVerifying } = useVerify2FA();
  const { mutateAsync: disable, isPending: isDisabling } = useDisable2FA();

  const verifyForm = useForm<TwoFactorVerifyFormValues>({
    resolver: zodResolver(twoFactorVerifySchema()),
    defaultValues: { code: "" },
  });

  const disableForm = useForm<TwoFactorDisableFormValues>({
    resolver: zodResolver(twoFactorDisableSchema()),
    defaultValues: { code: "" },
  });

  async function handleStartSetup() {
    setIsSettingUp(true);
    try {
      const res = await setup2FA();
      setSetupData(res.data ?? null);
      setStep("setup");
    } catch {
      toast.error(t("setting:twoFaSetupFailed"));
    } finally {
      setIsSettingUp(false);
    }
  }

  async function handleVerify(values: TwoFactorVerifyFormValues) {
    try {
      const res = await verify(values.code);
      setBackupCodes(res.data?.backupCodes ?? []);
      setStep("backupCodes");
    } catch (err: unknown) {
      const e = err as { message?: string };
      verifyForm.setError("code", { message: e?.message || "Invalid code" });
    }
  }

  async function handleDisable(values: TwoFactorDisableFormValues) {
    try {
      await disable(values.code);
      setStep("idle");
      disableForm.reset();
    } catch (err: unknown) {
      const e = err as { message?: string };
      disableForm.setError("code", { message: e?.message || "Invalid code" });
    }
  }

  function handleCopySecret() {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      toast.success(t("setting:twoFaSecretCopied"));
    }
  }

  function handleCopyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success(t("setting:twoFaBackupCodesCopied"));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {twoFactorEnabled ? <ShieldCheck className="size-5 text-green-500" /> : <Shield className="size-5 text-muted-foreground" />}
          <div>
            <CardTitle>{t("setting:twoFaTitle")}</CardTitle>
            <CardDescription>{t("setting:twoFaDescription")}</CardDescription>
          </div>
          {twoFactorEnabled && <Badge variant="secondary" className="ml-auto text-green-600 bg-green-50 border-green-200">{t("setting:twoFaEnabledBadge")}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Idle — 2FA not enabled */}
        {!twoFactorEnabled && step === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("setting:twoFaIdleDescription")}</p>
            <Button onClick={handleStartSetup} disabled={isSettingUp}>
              {isSettingUp && <Loader2 className="size-4 mr-2 animate-spin" />}
              {t("setting:twoFaEnableButton")}
            </Button>
          </div>
        )}

        {/* Step 1: Scan QR or enter secret */}
        {step === "setup" && setupData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("setting:twoFaSetupDescription")}</p>

            <div className="flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(setupData.otpauthUrl)}&size=180x180`}
                alt={t("setting:twoFaQrAlt")}
                className="rounded-lg border border-border"
                width={180}
                height={180}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("setting:twoFaManualEntryKey")}</p>
              <div className="flex items-center gap-2">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={setupData.secret}
                  readOnly
                  className="font-mono text-sm bg-muted"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowSecret((p) => !p)}>
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={handleCopySecret}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep("verify")} className="w-full">
              {t("setting:twoFaScannedButton")}
            </Button>
          </div>
        )}

        {/* Step 2: Verify TOTP code */}
        {step === "verify" && (
          <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("setting:twoFaVerifyDescription")}</p>
            <Field data-invalid={!!verifyForm.formState.errors.code}>
              <FieldLabel>{t("setting:twoFaVerificationCodeLabel")}</FieldLabel>
              <Input
                {...verifyForm.register("code")}
                placeholder="000000"
                maxLength={6}
                className="font-mono tracking-widest text-center text-lg"
                autoFocus
              />
              <FieldError errors={[verifyForm.formState.errors.code]} />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("setup")} disabled={isVerifying}>
                {t("setting:twoFaBackButton")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isVerifying}>
                {isVerifying && <Loader2 className="size-4 mr-2 animate-spin" />}
                {t("setting:twoFaVerifyEnableButton")}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Show backup codes */}
        {step === "backupCodes" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <p className="text-xs">{t("setting:twoFaBackupCodesWarning")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-xs font-mono bg-muted px-3 py-1.5 rounded text-center tracking-wider">
                  {code}
                </code>
              ))}
            </div>
            <Button variant="outline" onClick={handleCopyBackupCodes} className="w-full">
              <Copy className="size-4 mr-2" />
              {t("setting:twoFaCopyBackupCodes")}
            </Button>
            <Button onClick={() => setStep("idle")} className="w-full">
              {t("setting:twoFaDoneButton")}
            </Button>
          </div>
        )}

        {/* 2FA enabled — show manage options */}
        {twoFactorEnabled && step === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("setting:twoFaActiveDescription")}</p>
            <Separator />
            <Button variant="destructive" size="sm" onClick={() => setStep("disable")}>
              <ShieldOff className="size-4 mr-2" />
              {t("setting:twoFaDisableButton")}
            </Button>
          </div>
        )}

        {/* Disable 2FA form */}
        {step === "disable" && (
          <form onSubmit={disableForm.handleSubmit(handleDisable)} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("setting:twoFaDisableDescription")}</p>
            <Field data-invalid={!!disableForm.formState.errors.code}>
              <FieldLabel>{t("setting:twoFaCodeLabel")}</FieldLabel>
              <Input
                {...disableForm.register("code")}
                placeholder="000000"
                className="font-mono tracking-widest text-center text-lg"
                autoFocus
              />
              <FieldError errors={[disableForm.formState.errors.code]} />
            </Field>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("idle")} disabled={isDisabling}>
                {t("setting:cancelButton")}
              </Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={isDisabling}>
                {isDisabling && <Loader2 className="size-4 mr-2 animate-spin" />}
                {t("setting:twoFaDisableButton")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
