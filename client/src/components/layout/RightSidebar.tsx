import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInitials } from "@/utils/formatString";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import TrendingHashtags from "@/features/hashtags/components/TrendingHashtags";

export default function RightSidebar() {
  const { t } = useTranslation(["nav"]);

  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-6">
      {/* Current user card */}
      {user && (
        <div className="flex items-center gap-3">
          <Link to={`/profile/${user.username}`}>
            <Avatar className="size-11 ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback className="text-sm font-semibold">{formatInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user.username}`} className="text-sm font-semibold hover:underline underline-offset-2 truncate block">
              {user.name}
            </Link>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>
        </div>
      )}

      {/* Suggested users section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("nav:suggestions")}</span>
        </div>
        <SuggestedUsersList />
      </div>

      {/* Trending hashtags */}
      <TrendingHashtags limit={8} />

      {/* Footer links */}
      <div className="text-[11px] text-muted-foreground/60 leading-relaxed">
        <p> Ahmad Fiqri Oemry</p>
        <p>
          © {new Date().getFullYear()} Pixel. {t("nav:madeWithLove")}
        </p>
      </div>
    </div>
  );
}

function SuggestedUsersList() {
  const { t } = useTranslation(["nav"]);

  const isLoading = false;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
            </div>
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  return (
    <p className="text-xs text-muted-foreground">
      {t("nav:noSuggestions")}{" "}
      <Link to="/explore" className="text-primary hover:underline">
        {t("nav:explorePage")}
      </Link>
    </p>
  );
}
