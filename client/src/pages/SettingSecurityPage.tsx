// src/pages/SettingSecurityPage.tsx
import PasswordForm from "@/features/settings/components/PasswordForm";
import SessionList from "@/features/settings/components/SessionList";

export default function SettingSecurityPage() {
  return (
    <div className="space-y-6 max-w-2xl md:max-w-3xl w-full">
      <PasswordForm />
      <SessionList />
    </div>
  );
}
