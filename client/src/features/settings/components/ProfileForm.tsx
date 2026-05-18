// src/features/settings/components/ProfileForm.tsx
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import AvatarUploader from "./AvatarUploader";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import SelectField from "@/components/fields/SelectField";
import LongTextField from "@/components/fields/LongTextField";
import ShortTextField from "@/components/fields/ShortTextField";
import { useUpdateUserProfile } from "@/features/users/users.query";
import { profileFormSchema, type ProfileFormValues } from "@/schemas/settings.schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef } from "react";

const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
];

export default function ProfileForm() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateUserProfile();

  const defaultValues: ProfileFormValues = {
    name: user?.name || "",
    bio: user?.bio || "",
    gender: user?.gender || undefined,
  };
  const latestValuesRef = useRef(defaultValues);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  const values = watch();

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
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your account's profile information and avatar</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="text-sm font-medium mb-3 block">Avatar</label>
            <AvatarUploader />
          </div>

          {/* Name */}
          <ShortTextField control={control} name="name" label="Full Name" placeholder="Enter your full name" />

          {/* Username (Read-only) */}
          <div>
            <label className="text-sm font-medium mb-2 block">Username</label>
            <input type="text" value={user?.username || ""} disabled className="w-full px-3 py-2 text-sm border rounded-md bg-muted text-muted-foreground cursor-not-allowed" />
            <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
          </div>

          {/* Bio */}
          <LongTextField control={control} name="bio" label="Bio" placeholder="Tell us about yourself" description="Brief description for your profile. Max 160 characters" rows={3} />

          {/* Gender */}
          <SelectField control={control} name="gender" label="Gender" options={GENDER_OPTIONS} placeholder="Select gender" />
        </CardContent>

        {showActionButtons && (
          <CardFooter className="flex justify-end gap-3 mt-3">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => reset(latestValuesRef.current)}>
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
