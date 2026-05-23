// src/pages/SettingSecurityPage.tsx
import PasswordForm from "@/features/settings/components/PasswordForm";
import SessionList from "@/features/settings/components/SessionList";
import { Helmet } from "react-helmet-async";

export default function SettingSecurityPage() {
  return (
    <>
      <Helmet>
        <title>Security Settings - Pixel social media</title>
        <meta name="description" content="Manage your security settings on Pixel social media." />
        <meta name="keywords" content="security settings, social media, user" />
        <meta property="og:title" content="Security Settings - Pixel social media" />
        <meta property="og:description" content="Manage your security settings on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/settings/security" />
      </Helmet>
      <div className="space-y-6 max-w-2xl md:max-w-3xl w-full">
        <PasswordForm />
        <SessionList />
      </div>
    </>
  );
}
