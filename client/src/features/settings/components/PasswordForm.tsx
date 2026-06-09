import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Info, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import { useChangePassword, useSetPassword } from "@/features/auth/auth.query";
import { changePasswordSchema, setPasswordSchema, type ChangePasswordFormValues, type SetPasswordFormValues } from "@/schemas/settings.schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function SetPasswordForm() {
  const { t } = useTranslation(["setting"]);
  const setPasswordMutation = useSetPassword();
  const [error, setError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema()),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SetPasswordFormValues) => {
    setError(null);
    try {
      await setPasswordMutation.mutateAsync(data);
      reset();
    } catch (err) {
      const res = err as ResponseError;
      setError({ message: res?.message ?? "Failed to set password, please try again", errors: res?.errors });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("setting:setPasswordTitle")}</CardTitle>
        <CardDescription>{t("setting:setPasswordDescription")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t("setting:setPasswordHint")}</p>
          </div>
          <AlertCard message={error?.message} errors={error?.errors} />

          <PasswordField control={control} name="newPassword" label={t("setting:newPasswordLabel")} placeholder={t("setting:newPasswordPlaceholder")} description={t("setting:newPasswordDescription")} />
          <PasswordField control={control} name="confirmPassword" label={t("setting:confirmNewPasswordLabel")} placeholder={t("setting:confirmNewPasswordPlaceholder")} />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 mt-3">
          <Button type="button" variant="outline" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
            {t("setting:cancelButton")}
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("setting:setPasswordButton")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ChangePasswordForm() {
  const { t } = useTranslation(["setting"]);
  const { user } = useAuthStore();
  const changePassword = useChangePassword();
  const [error, setError] = useState<ResponseError | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema()),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setError(null);
    setConfirmOpen(false);
    try {
      await changePassword.mutateAsync(data);
      useAuthStore.getState().clearUser();
      reset();
    } catch (err) {
      const res = err as ResponseError;
      setError({ message: res?.message ?? "Password change failed, please try again", errors: res?.errors });
    }
  };

  const handleUpdateClick = async () => {
    const isValid = await trigger();
    if (isValid) setConfirmOpen(true);
  };

  const lastChanged = user?.lastChangePasswordAt ? formatDistanceToNow(new Date(user.lastChangePasswordAt), { addSuffix: true }) : "Never";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("setting:passwordTitle")}</CardTitle>
          <CardDescription>{t("setting:passwordDescription")}</CardDescription>
        </CardHeader>

        <form onSubmit={(e) => e.preventDefault()}>
          <CardContent className="space-y-4">
            <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">{t("setting:passwordLastChanged")}</p>
                <p className="text-muted-foreground">{lastChanged}</p>
              </div>
            </div>
            <AlertCard message={error?.message} errors={error?.errors} />

            <PasswordField control={control} name="currentPassword" label={t("setting:currentPasswordLabel")} placeholder={t("setting:currentPasswordPlaceholder")} />
            <PasswordField control={control} name="newPassword" label={t("setting:newPasswordLabel")} placeholder={t("setting:newPasswordPlaceholder")} description={t("setting:newPasswordDescription")} />
            <PasswordField control={control} name="confirmPassword" label={t("setting:confirmNewPasswordLabel")} placeholder={t("setting:confirmNewPasswordPlaceholder")} />
          </CardContent>

          <CardFooter className="flex justify-end gap-3 mt-3">
            <Button type="button" variant="outline" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
              {t("setting:cancelButton")}
            </Button>
            <Button type="button" disabled={!isDirty || isSubmitting} onClick={handleUpdateClick}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("setting:updatePasswordButton")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              {t("setting:changePasswordConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("setting:changePasswordConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t("setting:cancelButton")}</AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("setting:changePasswordConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function PasswordForm() {
  const { user } = useAuthStore();
  return user?.hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />;
}
