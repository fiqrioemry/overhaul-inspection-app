// src/features/notifications/components/NotificationBell.tsx
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnreadNotificationCount, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/notifications.query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/route.constant";
import { cn } from "@/lib/utils";

function notificationLabel(type: string): string {
  const labels: Record<string, string> = {
    INSPECTION_REVIEW_REQUESTED: "Inspection Review Requested",
    INSPECTION_REVIEWED: "Inspection Reviewed",
    FINDING_CREATED: "Finding Created",
    FINDING_STATUS_UPDATED: "Finding Updated",
    TEST_RESULT_UPDATED: "Test Result Updated",
    RADIOGRAPHY_RESULT_UPDATED: "Radiography Updated",
  };
  return labels[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data, isLoading } = useNotifications({ limit: 8 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-0.5 px-2"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notif.isRead && "bg-primary/5",
                  )}
                  onClick={() => {
                    if (!notif.isRead) markRead.mutate(notif.id);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className={cn("flex-1 min-w-0", notif.isRead && "pl-4")}>
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {notificationLabel(notif.type)}
                      </p>
                      <p className="text-sm leading-snug mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2">
          <Link
            to={ROUTES.NOTIFICATIONS}
            className="text-xs text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
