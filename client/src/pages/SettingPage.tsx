import { Link, Outlet, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "account", label: "Account" },
  { value: "security", label: "Security" },
  { value: "notifications", label: "Notifications" },
];

export default function SettingPage() {
  const { pathname } = useLocation();
  const currentTab = pathname.split("/").pop() || "account";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-sm text-muted-foreground">This is the settings page. You can put your user settings here.</p>

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
  );
}
