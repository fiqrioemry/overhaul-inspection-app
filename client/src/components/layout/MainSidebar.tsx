import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useTheme from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { logout } from "@/features/auth/auth.api";
import { useLanguage } from "@/hooks/useLanguage";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/auth.store";
import { useState, useRef, useEffect } from "react";
import { formatInitials } from "@/utils/formatString";
import { useSearchUsers } from "@/features/users/users.query";
import UserAvatar from "@/features/users/components/UserAvatar";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUnreadMessagesCount } from "@/features/chats/chats.query";
import CreatePostDialog from "@/features/posts/components/CreatePostDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnreadNotificationCount } from "@/features/notifications/notifications.query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Compass, PlusSquare, LogOut, Settings, Sun, Moon, ChevronDown, Search, X, User, Bell, MessageCircle, Languages } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function MainSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleDarkMode, darkMode } = useTheme();
  const { currentLanguage, changeLanguage, LANGUAGE_LABELS } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation(["common", "nav"]);

  const isCollapsed = location.pathname.startsWith("/message") || location.pathname.startsWith("/notifications");

  const NAV_ITEMS = [
    { icon: Home, label: t("nav:home"), to: "/" },
    { icon: Compass, label: t("nav:explore"), to: "/explore" },
    { icon: MessageCircle, label: t("nav:messages"), to: "/message" },
    { icon: Bell, label: t("nav:notifications"), to: "/notifications" },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchResults, isFetching: isSearching } = useSearchUsers({ search: debouncedSearch });
  const { data: notificationCount } = useUnreadNotificationCount();
  const { data: unreadMessagesCount } = useUnreadMessagesCount();

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
      if (res.success) {
        useAuthStore.getState().clearUser();
        window.location.href = "/login";
      }
    } catch {
      toast.error(t("common:logoutFailed"));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
            "hidden md:flex flex-col fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40 py-6 gap-2 transition-all duration-300",
            isCollapsed ? "w-16 px-2 items-center" : "w-64 xl:w-72 px-4",
          )}
        >
          {/* Logo */}
          <div className={cn("mb-6", isCollapsed ? "flex justify-center px-0" : "px-3")}>
            {isCollapsed ? (
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                P<span className="text-primary">.</span>
              </span>
            ) : (
              <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                Pixel<span className="text-primary">.</span>
              </span>
            )}
          </div>

          {/* Search — hidden in collapsed mode */}
          {!isCollapsed && (
            <div className="relative mb-2" ref={searchRef}>
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("common:searchPlaceholder")}
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

              {showSearch && debouncedSearch.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">{t("common:loading")}</div>
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
                    <div className="px-4 py-3 text-sm text-muted-foreground">{t("common:noResults")}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nav Items */}
          <nav className={cn("flex flex-col gap-1 flex-1", isCollapsed && "items-center w-full")}>
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
              const isActive = location.pathname === to;
              const unreadCount = notificationCount ?? 0;
              const unreadMessages = unreadMessagesCount ?? 0;
              const isNotif = to === "/notifications";
              const isMessage = to === "/message";

              const linkContent = (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "relative flex items-center rounded-xl text-sm font-medium transition-all group",
                    isCollapsed ? "justify-center p-2.5 w-full" : "gap-3.5 px-3 py-2.5",
                    isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="relative shrink-0">
                    <Icon className={cn("size-5", !isActive && "group-hover:scale-110 transition-transform")} />
                    {isNotif && unreadCount > 0 && (
                      <span className={cn("absolute -top-2 -right-2 min-w-4.5 h-4.5", "px-1 flex items-center justify-center", "rounded-full bg-red-500 text-white", "text-[10px] font-bold leading-none", "ring-2 ring-sidebar shadow-sm")}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    {isMessage && unreadMessages > 0 && (
                      <span className={cn("absolute -top-2 -right-2 min-w-4.5 h-4.5", "px-1 flex items-center justify-center", "rounded-full bg-red-500 text-white", "text-[10px] font-bold leading-none", "ring-2 ring-sidebar shadow-sm")}>
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={to}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}

            {/* Create Post */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex items-center justify-center p-2.5 w-full rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all group mt-1"
                  >
                    <PlusSquare className="size-5 shrink-0 group-hover:scale-110 transition-transform" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("common:createPost")}</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all group mt-1"
              >
                <PlusSquare className="size-5 shrink-0 group-hover:scale-110 transition-transform" />
                {t("common:createPost")}
              </button>
            )}
          </nav>

          {/* Profile Dropdown */}
          <div className={cn("mt-auto pt-4 border-t border-sidebar-border", isCollapsed && "w-full flex justify-center")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center justify-center p-1.5 rounded-xl hover:bg-muted transition-colors">
                        <Avatar className="size-8 shrink-0 ring-2 ring-primary/20">
                          <AvatarImage src={user?.avatar ?? undefined} />
                          <AvatarFallback className="text-xs font-semibold">{formatInitials(user?.name ?? "")}</AvatarFallback>
                        </Avatar>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{user?.name}</TooltipContent>
                  </Tooltip>
                ) : (
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
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align={isCollapsed ? "center" : "start"} className="w-56 mb-1">
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 cursor-pointer">
                    <User className="size-4" />
                    {t("common:profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="size-4" />
                    {t("common:settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDarkMode} className="flex items-center gap-2 cursor-pointer">
                  {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {darkMode ? t("common:lightMode") : t("common:darkMode")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 cursor-pointer">
                      <Languages className="size-4" />
                      {LANGUAGE_LABELS[currentLanguage]}
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuItem onClick={() => changeLanguage("en")} className={cn("cursor-pointer", currentLanguage === "en" && "font-semibold text-primary")}>
                      🇺🇸 English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeLanguage("id")} className={cn("cursor-pointer", currentLanguage === "id" && "font-semibold text-primary")}>
                      🇮🇩 Bahasa Indonesia
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="size-4" />
                  {isLoggingOut ? t("common:loggingOut") : t("common:logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
      </TooltipProvider>

      {showCreatePost && <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} />}
    </>
  );
}
