import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/features/notifications/notifications.query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function notificationLabel(type: string): string {
  const labels: Record<string, string> = {
    INSPECTION_REVIEW_REQUESTED: "Inspection Review Requested",
  };
  return labels[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NotificationPage() {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const notifications = data?.items ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">Your recent activity alerts</p>
          </div>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-lg border divide-y">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Bell className="size-8 mx-auto mb-3 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              className={cn("w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors flex items-start gap-3", !notif.isRead && "bg-primary/5")}
              onClick={() => {
                if (!notif.isRead) markRead.mutate(notif.id);
              }}
            >
              {!notif.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              <div className={cn("flex-1 min-w-0", notif.isRead && "pl-5")}>
                <p className="text-xs font-medium text-muted-foreground">{notificationLabel(notif.type)}</p>
                <p className="text-sm mt-0.5">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
