// src/components/layout/Navbar.tsx
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronDown, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/features/auth/auth.query";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { ROUTES } from "@/constants/route.constant";
import { useUIStore } from "@/stores/ui.store";

const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  INSPECTOR: "Inspector",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

function userInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 gap-3">
      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={toggleDarkMode} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
        {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
            <Avatar className="size-7">
              <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
              <AvatarFallback className="text-xs">{user?.name ? userInitials(user.name) : "?"}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-sm font-medium">{user?.name ?? "User"}</span>
              <span className="text-xs text-muted-foreground">{user?.role ? ROLE_LABELS[user.role] : ""}</span>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(ROUTES.PROFILE)}>
            <User className="size-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout} disabled={logoutMutation.isPending}>
            <LogOut className="size-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
