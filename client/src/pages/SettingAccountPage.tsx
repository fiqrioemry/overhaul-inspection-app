// src/pages/SettingAccountPage.tsx
import ProfileForm from "@/features/settings/components/ProfileForm";
import PrivacyToggle from "@/features/settings/components/PrivacyToggle";
import { Helmet } from "react-helmet-async";

export default function SettingAccountPage() {
  return (
    <>
      <Helmet>
        <title>Account Settings - Pixel social media</title>
        <meta name="description" content="Manage your account settings on Pixel social media." />
        <meta name="keywords" content="account settings, social media, user" />
        <meta property="og:title" content="Account Settings - Pixel social media" />
        <meta property="og:description" content="Manage your account settings on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/settings/account" />
      </Helmet>
      <div className="space-y-6 max-w-2xl md:max-w-3xl w-full">
        <ProfileForm />
        <PrivacyToggle />
      </div>
    </>
  );
}
