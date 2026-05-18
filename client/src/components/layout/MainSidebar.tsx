import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useTheme from "@/hooks/useTheme";
import { logout } from "@/features/auth/auth.api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/auth.store";
import { useState, useRef, useEffect } from "react";
import { formatInitials } from "@/utils/formatString";
import { useSearchUsers } from "@/features/users/users.query";
import UserAvatar from "@/features/users/components/UserAvatar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CreatePostDialog from "@/features/posts/components/CreatePostDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnreadNotificationCount } from "@/features/notifications/notifications.query";
import { Home, Compass, PlusSquare, LogOut, Settings, Sun, Moon, ChevronDown, Search, X, User, Bell, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Compass, label: "Explore", to: "/explore" },
  { icon: MessageCircle, label: "Message", to: "/message" },
  { icon: Bell, label: "Notifications", to: "/notifications" },
];

export default function MainSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleDarkMode, darkMode } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchResults, isFetching: isSearching } = useSearchUsers({ search: debouncedSearch });
  const { data: notificationCount } = useUnreadNotificationCount();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const res = await logout();
      console.log("data", res);
      if (res.success) {
        useAuthStore.getState().clearUser();
        window.location.href = "/login";
      }
    } catch {
      toast.error("Gagal logout, coba lagi.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 xl:w-72 bg-sidebar border-r border-sidebar-border z-40 px-4 py-6 gap-2">
        {/* Logo */}
        <div className="px-3 mb-6">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            Pixel<span className="text-primary">.</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-muted/60 border border-transparent focus:border-primary/30 focus:bg-background focus:outline-none transition-all placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearch(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && debouncedSearch.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">Mencari...</div>
              ) : searchResults?.data && Array.isArray(searchResults.data) && searchResults.data.length > 0 ? (
                <ul>
                  {searchResults.data.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => {
                          navigate(`/profile/${u.username}`, { replace: true });
                          setSearchQuery("");
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                      >
                        <UserAvatar user={u} size={"sm"} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">Tidak ada pengguna ditemukan.</div>
              )}
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const isActive = location.pathname === to;
            const unreadCount = notificationCount ?? 0;

            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {/* Icon Wrapper */}
                <div className="relative shrink-0">
                  {label === "Profile" ? <UserAvatar user={user!} size="md" /> : <Icon className={cn("size-5", !isActive && "group-hover:scale-110 transition-transform")} />}

                  {/* Notification Badge */}
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className={cn("absolute -top-2 -right-2 min-w-4.5 h-4.5", "px-1 flex items-center justify-center", "rounded-full bg-red-500 text-white", "text-[10px] font-bold leading-none", "ring-2 ring-sidebar shadow-sm")}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* Create Post Button */}
          <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all group mt-1">
            <PlusSquare className="size-5 shrink-0 group-hover:scale-110 transition-transform" />
            Create Posting
          </button>
        </nav>

        {/* Profile Dropdown */}
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group">
                <Avatar className="size-9 shrink-0 ring-2 ring-primary/20">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback className="text-sm font-semibold">{formatInitials(user?.name ?? "")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 cursor-pointer">
                  <User className="size-4" />
                  Profile
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
                {darkMode ? "Mode Terang" : "Mode Gelap"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="size-4" />
                {isLoggingOut ? "Logged out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Create Post Modal */}
      {showCreatePost && <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} />}
    </>
  );
}
