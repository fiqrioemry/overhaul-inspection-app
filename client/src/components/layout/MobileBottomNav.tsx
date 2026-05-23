import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import useTheme from "@/hooks/useTheme";
import { logout } from "@/features/auth/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { formatInitials } from "@/utils/formatString";
import { Link, useLocation } from "react-router-dom";
import CreatePostDialog from "@/features/posts/components/CreatePostDialog";
import SearchUserDialog from "@/features/users/components/SearchUserDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Compass, PlusSquare, User, Search, ChevronUp, Settings, Sun, Moon, LogOut, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Compass, label: "Explore", to: "/explore" },
  { icon: MessageCircle, label: "Messages", to: "/message" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { handleDarkMode, darkMode } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [showSearch, setShowSearch] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const res = await logout();
      if (res.success) {
        useAuthStore.getState().clearUser();
        window.location.href = "/login";
      }
    } catch {
      toast.error("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <nav className="bg-background/95 backdrop-blur-md border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link key={to} to={to} className={cn("flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Icon className={cn("size-5", isActive && "fill-primary/10")} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Search */}
          <button onClick={() => setShowSearch(true)} className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <Search className="size-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Create Post */}
          <button onClick={() => setShowCreatePost(true)} className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <PlusSquare className="size-5" />
            <span className="text-[10px] font-medium">Create</span>
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-muted-foreground hover:text-foreground transition-all relative">
                <Avatar className="size-7 ring-2 ring-primary/20">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px] font-semibold">{formatInitials(user?.name ?? "")}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-medium">Profile</span>
                <ChevronUp className="absolute -top-0.5 right-1 size-3 text-muted-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-52 mb-1">
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 cursor-pointer">
                  <User className="size-4" />
                  See Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDarkMode} className="flex items-center gap-2 cursor-pointer">
                {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="size-4" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <SearchUserDialog open={showSearch} onOpenChange={setShowSearch} />
      {showCreatePost && <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} />}
    </div>
  );
}
