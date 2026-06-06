import { Helmet } from "react-helmet-async";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingPage() {
  const { t } = useTranslation(["setting"]);
  const { pathname } = useLocation();
  const currentTab = pathname.split("/").pop() || "account";

  const tabs = [
    { value: "account", label: t("setting:tabAccount") },
    { value: "security", label: t("setting:tabSecurity") },
    { value: "notifications", label: t("setting:tabNotifications") },
  ];

  return (
    <>
      <Helmet>
        <title>Settings - Pixel social media</title>
        <meta name="description" content="Manage your settings on Pixel social media." />
        <meta name="keywords" content="settings, social media, user" />
        <meta property="og:title" content="Settings - Pixel social media" />
        <meta property="og:description" content="Manage your settings on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://pixel.ahmadfiqrioemry.com/settings/${currentTab}`} />
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("setting:pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("setting:pageSubtitle")}</p>

        <Tabs value={currentTab} className="w-full mt-6 gap-6">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className="
                data-[state=active]:border-primary
                data-[state=active]:bg-transparent
              "
              >
                <Link to={`/settings/${tab.value}`}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 flex justify-center max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
}
