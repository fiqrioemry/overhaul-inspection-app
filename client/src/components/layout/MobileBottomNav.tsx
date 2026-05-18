import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useDebounce } from "@/hooks/useDebounce";
import { logout } from "@/features/auth/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import { useState, useRef, useEffect } from "react";
import { useSearchUsers } from "@/features/users/users.query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CreatePostDialog from "@/features/posts/components/CreatePostDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Compass, PlusSquare, BookMarked, User, Search, X, ChevronUp, Settings, Sun, Moon, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useTheme from "@/hooks/useTheme";

const NAV_ITEMS = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Compass, label: "Explore", to: "/explore" },
  { icon: BookMarked, label: "Saved", to: "/saved" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleDarkMode, darkMode } = useTheme();
  const user = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const { data: searchResults, isFetching: isSearching } = useSearchUsers({ search: debouncedSearch });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch {
      toast.error("Gagal logout, coba lagi.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Search bar above bottom nav */}
      <div ref={searchRef} className="relative bg-background/95 backdrop-blur-md border-t border-border px-4 py-2">
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
            className="w-full pl-9 pr-9 py-2 text-sm rounded-xl bg-muted/60 border border-transparent focus:border-primary/30 focus:bg-background focus:outline-none transition-all placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearch(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Search Results Dropdown (opens upward) */}
        {showSearch && debouncedSearch.trim().length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Mencari...</div>
            ) : searchResults?.data && Array.isArray(searchResults.data) && searchResults.data.length > 0 ? (
              <ul>
                {searchResults.data.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => {
                        navigate(`/profile/${u.username}`);
                        setSearchQuery("");
                        setShowSearch(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                    >
                      <Avatar className="size-8">
                        <AvatarImage src={u.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{u.name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
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

      {/* Bottom Nav Bar */}
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

          {/* Create Post */}
          <button onClick={() => setShowCreatePost(true)} className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <PlusSquare className="size-5" />
            <span className="text-[10px] font-medium">Buat</span>
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-muted-foreground hover:text-foreground transition-all relative">
                <Avatar className="size-7 ring-2 ring-primary/20">
                  <AvatarImage src={user?.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-medium">Profil</span>
                <ChevronUp className="absolute -top-0.5 right-1 size-3 text-muted-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-52 mb-1">
              <DropdownMenuItem asChild>
                <Link to={`/profile/${user?.username}`} className="flex items-center gap-2 cursor-pointer">
                  <User className="size-4" />
                  Lihat Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="size-4" />
                  Pengaturan
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
                {isLoggingOut ? "Keluar..." : "Keluar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {showCreatePost && <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} />}
    </div>
  );
}
