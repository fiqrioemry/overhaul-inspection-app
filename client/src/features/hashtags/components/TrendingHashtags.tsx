// src/features/hashtags/components/TrendingHashtags.tsx
import { Link } from "react-router-dom";
import { Hash, TrendingUp } from "lucide-react";
import { useTrendingHashtags } from "@/features/hashtags/hashtags.query";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingHashtagsProps {
  limit?: number;
  /** "sidebar" = vertical list (default); "explore" = horizontal scrollable chips */
  variant?: "sidebar" | "explore";
}

export default function TrendingHashtags({ limit = 10, variant = "sidebar" }: TrendingHashtagsProps) {
  const { data, isLoading } = useTrendingHashtags(limit);
  const hashtags = data?.data ?? [];

  if (variant === "explore") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <span className="text-sm font-semibold">Trending Hashtags</span>
        </div>

        {isLoading && (
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        )}

        {!isLoading && hashtags.length === 0 && (
          <p className="text-sm text-muted-foreground">No trending hashtags yet.</p>
        )}

        {!isLoading && hashtags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {hashtags.map((tag) => (
              <Link
                key={tag.id}
                to={`/hashtag/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-muted/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-sm font-medium"
              >
                <Hash className="size-3.5 shrink-0" />
                {tag.name}
                <span className="text-[11px] opacity-60 ml-0.5">{tag.postCount.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trending Hashtags</span>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && hashtags.length === 0 && (
        <p className="text-xs text-muted-foreground">No trending hashtags yet.</p>
      )}

      {!isLoading && hashtags.length > 0 && (
        <div className="space-y-1.5">
          {hashtags.map((tag) => (
            <Link
              key={tag.id}
              to={`/hashtag/${encodeURIComponent(tag.name)}`}
              className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/60 transition-colors group"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Hash className="size-3.5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {tag.name}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                {tag.postCount.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
