// src/features/settings/components/PasswordForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import { useChangePassword } from "@/features/auth/auth.query";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/schemas/settings.schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PasswordForm() {
  const { t } = useTranslation(["setting"]);
  const { user } = useAuthStore();
  const changePassword = useChangePassword();
  const [error, setError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setError(null);

    try {
      await changePassword.mutateAsync(data);
      useAuthStore.getState().clearUser();
      reset();
    } catch (error) {
      const res = error as ResponseError;
      setError({
        message: res?.message ?? "Password change failed, please try again",
        errors: res?.errors,
      });
    }
  };

  const lastChanged = user?.lastChangePasswordAt ? formatDistanceToNow(new Date(user.lastChangePasswordAt), { addSuffix: true }) : "Never";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("setting:passwordTitle")}</CardTitle>
        <CardDescription>{t("setting:passwordDescription")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Info Alert */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{t("setting:passwordLastChanged")}</p>
              <p className="text-muted-foreground">{lastChanged}</p>
            </div>
          </div>
          <AlertCard message={error?.message} errors={error?.errors} />

          {/* Current Password */}
          <PasswordField control={control} name="currentPassword" label={t("setting:currentPasswordLabel")} placeholder={t("setting:currentPasswordPlaceholder")} />

          {/* New Password */}
          <PasswordField control={control} name="newPassword" label={t("setting:newPasswordLabel")} placeholder={t("setting:newPasswordPlaceholder")} description={t("setting:newPasswordDescription")} />

          {/* Confirm Password */}
          <PasswordField control={control} name="confirmPassword" label={t("setting:confirmNewPasswordLabel")} placeholder={t("setting:confirmNewPasswordPlaceholder")} />
        </CardContent>

        <CardFooter className="flex justify-end gap-3 mt-3">
          <Button type="button" variant="outline" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
            {t("setting:cancelButton")}
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("setting:updatePasswordButton")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
