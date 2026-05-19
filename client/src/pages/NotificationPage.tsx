/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { Checkbox } from "@/components/ui/checkbox";
import type { NotificationType } from "@/types/notifications.type";
import type { GetNotificationRequest } from "@/schemas/notification.schema";
import NotificationList from "@/features/notifications/components/NotificationList";
import NotificationSearch from "@/features/notifications/components/NotificationSearch";
import NotificationTabList from "@/features/notifications/components/NotificationTabList";
import { useInfiniteNotifications, useMarkAsRead, useDeleteNotification } from "@/features/notifications/notifications.query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type TabType = NotificationType | "";

export default function NotificationPage() {
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<TabType>("");
  const [isSelectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

  // IDs waiting for user confirmation in the AlertDialog.
  // Single delete → [oneId]; bulk delete → [...selectedIds].
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[]>([]);
  const isConfirmOpen = pendingDeleteIds.length > 0;

  const debouncedSearch = useDebounce(search, 300);

  const query: Omit<GetNotificationRequest, "page"> = {
    search: debouncedSearch || undefined,
    type: activeTab || undefined,
    limit: 10,
    orderBy: "createdAt",
    sortBy: "desc",
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteNotifications(query);

  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: deleteNotification, isPending: isDeleting } = useDeleteNotification();

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];
  const allIds = notifications.map((n) => n.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  React.useEffect(() => {
    const unreadIds = notifications.filter((n) => n.readAt === null).map((n) => n.id);

    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }, [isLoading]);

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  };

  const requestDelete = (ids: string[]) => setPendingDeleteIds(ids);

  const confirmDelete = () => {
    const ids = [...pendingDeleteIds];
    setPendingDeleteIds([]);
    setDeletingIds(new Set(ids));

    deleteNotification(ids, {
      onSettled: () => {
        setDeletingIds(new Set());
        if (ids.length > 1) {
          // After bulk delete: exit select mode
          setSelectMode(false);
          setSelectedIds(new Set());
        } else {
          // After single delete: remove only that id from selection
          setSelectedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
        }
      },
    });
  };

  const bulkDeleteLabel = selectedIds.size === 0 ? "Delete selected" : `Delete ${selectedIds.size} notification${selectedIds.size > 1 ? "s" : ""}`;

  const confirmTitle = pendingDeleteIds.length === 1 ? "Delete notification?" : `Delete ${pendingDeleteIds.length} notifications?`;

  const confirmDescription = pendingDeleteIds.length === 1 ? "This notification will be permanently removed." : `These ${pendingDeleteIds.length} notifications will be permanently removed.`;

  return (
    <div className="mx-auto w-full max-w-2xl px-0 md:px-4 py-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay up to date with your activity.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleSelectMode} className="text-xs text-muted-foreground hover:text-foreground mt-0.5">
          {isSelectMode ? "Cancel" : "Select"}
        </Button>
      </div>

      <NotificationSearch value={search} onChange={setSearch} />

      <NotificationTabList value={activeTab} onChange={setActiveTab} />

      {isSelectMode && notifications.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all notifications" className="h-4 w-4" />
            <span className="text-xs text-muted-foreground select-none">{allSelected ? "Deselect all" : "Select all"}</span>
          </label>

          <Button variant="destructive" size="sm" disabled={!someSelected || isDeleting} onClick={() => requestDelete([...selectedIds])} className="h-7 text-xs gap-1.5">
            <Trash2 size={12} />
            {bulkDeleteLabel}
          </Button>
        </div>
      )}

      {isError && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">Failed to load notifications. Please try again.</div>}

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
