// src/pages/SettingNotificationPage.tsx
import NotificationToggleGroup from "@/features/settings/components/NotificationToggleGroup";
import { Helmet } from "react-helmet-async";

export default function SettingNotificationPage() {
  return (
    <>
      <Helmet>
        <title>Notification Settings - Pixel social media</title>
        <meta name="description" content="Manage your notification settings on Pixel social media." />
        <meta name="keywords" content="notification settings, social media, user" />
        <meta property="og:title" content="Notification Settings - Pixel social media" />
        <meta property="og:description" content="Manage your notification settings on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/settings/notifications" />
      </Helmet>
      <div className="space-y-6 max-w-2xl md:max-w-3xl w-full">
        <NotificationToggleGroup />
      </div>
    </>
  );
}
