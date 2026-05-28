import React from "react";
import { Loader2, BellOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notification } from "@/types/notifications.type";
import NotificationItem from "@/features/notifications/components/NotificationItem";
import { useTranslation } from "react-i18next";

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-border bg-card">
      <Skeleton className="mt-0.5 h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-2.5 w-16 rounded" />
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  const { t } = useTranslation(["notif"]);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <BellOff size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{hasSearch ? t("notif:noResults") : t("notif:noNotifications")}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-50">{hasSearch ? t("notif:tryDifferentSearch") : t("notif:checkBackLater")}</p>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  hasSearch: boolean;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  deletingIds: Set<string>;
  onLoadMore: () => void;
  onToggleSelect: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

export default function NotificationList({ notifications, isLoading, isFetchingNextPage, hasNextPage, hasSearch, isSelectMode, selectedIds, deletingIds, onLoadMore, onToggleSelect, onRequestDelete }: NotificationListProps) {
  const { t } = useTranslation(["notif"]);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return <EmptyState hasSearch={hasSearch} />;
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.has(notification.id)}
          isDeleting={deletingIds.has(notification.id)}
          onToggleSelect={onToggleSelect}
          onRequestDelete={onRequestDelete}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasNextPage && notifications.length > 0 && <p className="py-4 text-center text-[11px] text-muted-foreground/50 tracking-wide uppercase">{t("notif:noMoreNotifications")}</p>}
    </div>
  );
}
