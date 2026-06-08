// src/features/settings/components/ProfileForm.tsx
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Controller } from "react-hook-form";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AvatarUploader from "./AvatarUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import SelectField from "@/components/fields/SelectField";
import LongTextField from "@/components/fields/LongTextField";
import ShortTextField from "@/components/fields/ShortTextField";
import { useDebounce } from "@/hooks/useDebounce";
import { useCheckUsername, useUpdateUserProfile } from "@/features/users/users.query";
import { profileFormSchema, type ProfileFormValues } from "@/schemas/settings.schema";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileForm() {
  const { t } = useTranslation(["setting"]);
  const { user } = useAuthStore();
  const updateProfile = useUpdateUserProfile();

  const GENDER_OPTIONS = [
    { label: t("setting:genderMale"), value: "MALE" },
    { label: t("setting:genderFemale"), value: "FEMALE" },
  ];

  const defaultValues: ProfileFormValues = {
    name: user?.name || "",
    bio: user?.bio || "",
    gender: user?.gender || undefined,
    website: (user as import("@/types/users.type").UserAccount | null)?.website || "",
    username: user?.username || "",
  };
  const latestValuesRef = useRef(defaultValues);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema()),
    defaultValues,
  });

  const values = watch();
  const usernameValue = watch("username") ?? "";
  const debouncedUsername = useDebounce(usernameValue, 600);

  const { data: usernameCheckData, isFetching: isCheckingUsername } = useCheckUsername(debouncedUsername, user?.username ?? "");

  const isUsernameChanged = debouncedUsername !== (user?.username ?? "") && debouncedUsername.length >= 3;
  const isUsernameAvailable = isUsernameChanged && !isCheckingUsername && usernameCheckData?.data?.available === true;
  const isUsernameTaken = isUsernameChanged && !isCheckingUsername && usernameCheckData?.data?.available === false;
  const showUsernameLoader = isUsernameChanged && (isCheckingUsername || usernameValue !== debouncedUsername);

  const hasNonEmptyValue = Object.values(values).some((value) => value !== undefined && value !== null && String(value).trim() !== "");

  const showActionButtons = isDirty && hasNonEmptyValue;

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfile.mutateAsync(data);
    latestValuesRef.current = data;
    reset(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("setting:profileTitle")}</CardTitle>
        <CardDescription>{t("setting:profileDescription")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="text-sm font-medium mb-3 block">{t("setting:avatarLabel")}</label>
            <AvatarUploader />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("setting:emailLabel")}</label>
            <input type="text" value={user?.email || ""} disabled className="w-full px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground cursor-not-allowed" />
            <p className="text-xs text-muted-foreground mt-1">{t("setting:emailCannotChange")}</p>
          </div>

          {/* Username */}
          <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error || isUsernameTaken}>
                <FieldLabel htmlFor="username">{t("setting:usernameLabel")}</FieldLabel>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder={t("setting:usernamePlaceholder")}
                    {...field}
                    className={cn("pr-10", {
                      "border-green-500 focus-visible:ring-green-500": isUsernameAvailable,
                      "border-destructive focus-visible:ring-destructive": isUsernameTaken,
                    })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showUsernameLoader && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {isUsernameAvailable && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {isUsernameTaken && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                <FieldError errors={[fieldState.error]} />
                {isUsernameTaken && !fieldState.error && <p className="text-xs text-destructive mt-1">{t("setting:usernameTaken")}</p>}
                {isUsernameAvailable && <p className="text-xs text-green-500 mt-1">{t("setting:usernameAvailable")}</p>}
              </Field>
            )}
          />

          {/* Name */}
          <ShortTextField control={control} name="name" label={t("setting:fullNameLabel")} placeholder={t("setting:fullNamePlaceholder")} />

          {/* Bio */}
          <LongTextField control={control} name="bio" label={t("setting:bioLabel")} placeholder={t("setting:bioPlaceholder")} description={t("setting:bioDescription")} rows={3} />

          {/* Website */}
          <ShortTextField control={control} name="website" label={t("setting:websiteLabel")} placeholder={t("setting:websitePlaceholder")} description={t("setting:websiteDescription")} />

          {/* Gender */}
          <SelectField control={control} name="gender" label={t("setting:genderLabel")} options={GENDER_OPTIONS} placeholder={t("setting:genderPlaceholder")} />
        </CardContent>

        {showActionButtons && (
          <CardFooter className="flex justify-end gap-3 mt-3">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => reset(latestValuesRef.current)}>
              {t("setting:cancelButton")}
            </Button>

            <Button type="submit" disabled={isSubmitting || isUsernameTaken || showUsernameLoader}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("setting:saveChanges")}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
