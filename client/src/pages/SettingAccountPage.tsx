// src/pages/SettingAccountPage.tsx
import ProfileForm from "@/features/settings/components/ProfileForm";
import PrivacyToggle from "@/features/settings/components/PrivacyToggle";

export default function SettingAccountPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <ProfileForm />
      <PrivacyToggle />
    </div>
  );
}
