import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Notification, NotificationType } from "@/types/notifications.type";
import { MessageSquare, Heart, UserPlus, AtSign, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  COMMENT: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  LIKE: { icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  FOLLOW: { icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  MENTION: { icon: AtSign, color: "text-violet-500", bg: "bg-violet-500/10" },
  MESSAGE: { icon: Loader2, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  REQUEST: { icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
};

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const ms = now.getTime() - d.getTime();
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface NotificationItemProps {
  notification: Notification;
  isSelectMode: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (id: string) => void;
  onRequestDelete: (id: string) => void;
}

export default function NotificationItem({ notification, isSelectMode, isSelected, isDeleting, onToggleSelect, onRequestDelete }: NotificationItemProps) {
  const { t } = useTranslation(["notif"]);
  const { icon: Icon, color, bg } = TYPE_CONFIG[notification.type];
  const isUnread = notification.readAt === null;

  return (
    <div
      role={isSelectMode ? "button" : undefined}
      onClick={isSelectMode ? () => onToggleSelect(notification.id) : undefined}
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150",
        isUnread ? "bg-primary/3 border-primary/10" : "bg-card border-border",
        isSelected ? "border-primary/40 bg-primary/6 shadow-sm" : isUnread ? "hover:bg-primary/6" : "hover:bg-muted/40",
        isSelectMode && "cursor-pointer select-none",
      )}
    >
      {/* Unread dot */}
      {isUnread && !isSelectMode && <span className="absolute top-3.5 right-11 h-2 w-2 rounded-full bg-primary" />}

      {/* Checkbox or icon */}
      <div className="mt-0.5  shrink-0 flex h-9 w-9 items-center justify-center">
        {isSelectMode ? (
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(notification.id)} onClick={(e) => e.stopPropagation()} aria-label={`Select notification: ${notification.title}`} className="h-4 w-4" />
        ) : (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", bg)}>
            <Icon size={16} className={color} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className={cn("text-sm leading-snug", isUnread ? "font-medium text-foreground" : "text-foreground/80")}>{notification.title}</p>
        {notification.description && <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>}
        <p className="text-[11px] text-muted-foreground/70 tabular-nums">{formatRelativeTime(notification.createdAt)}</p>
      </div>

      {!isSelectMode && (
        <Button
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          aria-label={t("notif:delete")}
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(notification.id);
          }}
          className={cn("h-7 w-7  shrink-0 opacity-0 group-hover:opacity-100", "text-muted-foreground hover:text-destructive hover:bg-destructive/10", "transition-all duration-150", isDeleting && "opacity-100")}
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </Button>
      )}
    </div>
  );
}
