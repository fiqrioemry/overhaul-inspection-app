import React from "react";
import { Trash2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { Checkbox } from "@/components/ui/checkbox";
import type { GetNotificationRequest } from "@/schemas/notification.schema";
import NotificationList from "@/features/notifications/components/NotificationList";
import NotificationSearch from "@/features/notifications/components/NotificationSearch";
import NotificationTabList, { type TabType } from "@/features/notifications/components/NotificationTabList";
import { useInfiniteNotifications, useMarkAsRead, useDeleteNotification } from "@/features/notifications/notifications.query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import FollowRequestList from "@/features/notifications/components/FollowRequestList";
import { useTranslation } from "react-i18next";

export default function NotificationPage() {
  const { t } = useTranslation(["notif"]);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<TabType>("");
  const [isSelectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[]>([]);

  const isConfirmOpen = pendingDeleteIds.length > 0;
  const isRequestTab = activeTab === "REQUEST";

  const debouncedSearch = useDebounce(search, 300);

  const query: Omit<GetNotificationRequest, "page"> = {
    search: debouncedSearch || undefined,
    type: activeTab === "" || activeTab === "REQUEST" ? undefined : activeTab,
    limit: 10,
    orderBy: "createdAt",
    sortBy: "desc",
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteNotifications(query, { enabled: !isRequestTab });

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: deleteNotification, isPending: isDeleting } = useDeleteNotification();

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];
  const allIds = notifications.map((n) => n.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  React.useEffect(() => {
    if (isRequestTab) return;
    const unreadIds = notifications.filter((n) => n.readAt === null).map((n) => n.id);
    if (unreadIds.length > 0) markAsRead(unreadIds);
  }, [isLoading, isRequestTab]);

  // Reset select mode when switching tabs
  function handleTabChange(tab: TabType) {
    setActiveTab(tab);
    setSelectMode(false);
    setSelectedIds(new Set());
  }
  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => setSelectedIds(allSelected ? new Set() : new Set(allIds));
  const requestDelete = (ids: string[]) => setPendingDeleteIds(ids);

  const confirmDelete = () => {
    const ids = [...pendingDeleteIds];
    setPendingDeleteIds([]);
    setDeletingIds(new Set(ids));
    deleteNotification(ids, {
      onSettled: () => {
        setDeletingIds(new Set());
        if (ids.length > 1) {
          setSelectMode(false);
          setSelectedIds(new Set());
        } else {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
        }
      },
    });
  };

  const bulkDeleteLabel = selectedIds.size === 0 ? t("notif:deleteSelected") : t("notif:deleteMultiple", { count: selectedIds.size });
  const confirmTitle = pendingDeleteIds.length === 1 ? t("notif:confirmDeleteTitle") : t("notif:confirmDeleteAllTitle");
  const confirmDescription = pendingDeleteIds.length === 1 ? t("notif:confirmDeleteDescription") : t("notif:confirmDeleteAllDescription", { count: pendingDeleteIds.length });

  return (
    <>
      <Helmet>
        <title>{t("notif:notifications")} - Pixel social media</title>
        <meta name="description" content="Stay up to date with your activity on Pixel social media." />
        <meta name="keywords" content="notifications, social media, activity" />
        <meta property="og:title" content={`${t("notif:notifications")} - Pixel social media`} />
        <meta property="og:description" content="Stay up to date with your activity on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/notifications" />
      </Helmet>

      <div className="mx-auto w-full max-w-4xl px-0 md:px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight">{t("notif:notifications")}</h1>
            <p className="text-sm text-muted-foreground">{t("notif:noNotifications")}</p>
          </div>
          {!isRequestTab && notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={toggleSelectMode} className="text-xs text-muted-foreground hover:text-foreground mt-0.5">
              {isSelectMode ? t("notif:cancel") : t("notif:select")}
            </Button>
          )}
        </div>

        <NotificationSearch value={search} onChange={setSearch} />
        <NotificationTabList value={activeTab} onChange={handleTabChange} />

        {/* Request tab — dedicated UI */}
        {isRequestTab ? (
          <FollowRequestList search={debouncedSearch} />
        ) : (
          <>
            {isSelectMode && notifications.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label={t("notif:selectAll")} className="h-4 w-4" />
                  <span className="text-xs text-muted-foreground select-none">{allSelected ? t("notif:deselectAll") : t("notif:selectAll")}</span>
                </label>
                <Button variant="destructive" size="sm" disabled={!someSelected || isDeleting} onClick={() => requestDelete([...selectedIds])} className="h-7 text-xs gap-1.5">
                  <Trash2 size={12} />
                  {bulkDeleteLabel}
                </Button>
              </div>
            )}

            {isError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{t("notif:failedToLoad")}</div>}

            {!isError && (
              <NotificationList
                notifications={notifications}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                hasSearch={!!debouncedSearch || !!activeTab}
                isSelectMode={isSelectMode}
                selectedIds={selectedIds}
                deletingIds={deletingIds}
                onLoadMore={fetchNextPage}
                onToggleSelect={toggleSelectItem}
                onRequestDelete={(id) => requestDelete([id])}
              />
            )}
          </>
        )}

        <AlertDialog
          open={isConfirmOpen}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteIds([]);
          }}
        >
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("notif:cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} variant="destructive">
                {t("notif:delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
