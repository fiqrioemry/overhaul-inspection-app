import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, Flag, LogOut } from "lucide-react";
import { logout } from "@/features/auth/auth.api";

export default function AdminLayout() {
  const { t } = useTranslation(["admin", "common"]);
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    try {
      await logout();
      useAuthStore.getState().clearUser();
      window.location.href = "/login";
    } catch {
      toast.error(t("common:logoutFailed"));
    }
  }

  const navItems = [
    { to: "/admin", label: t("admin:navDashboard"), icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: t("admin:navUsers"), icon: Users, end: false },
    { to: "/admin/reports", label: t("admin:navReports"), icon: Flag, end: false },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/30">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2 px-5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">{t("admin:sidebarTitle")}</span>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* User profile */}
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <Avatar className="size-8">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback className="text-xs">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title={t("common:logout")}
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
