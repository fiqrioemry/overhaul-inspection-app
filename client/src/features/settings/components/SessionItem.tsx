import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import type { SessionWithCurrent } from "@/types/sessions.type";
import { Laptop, Loader2, LogOut, Phone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionItemProps {
  session: SessionWithCurrent;
  onDelete: (sessionId: string) => void;
  isDeleting: boolean;
}

function renderDeviceIcon(device: string, isCurrent: boolean) {
  const deviceLower = device.toLowerCase();
  const iconClass = cn("h-5 w-5", isCurrent ? "text-green-600 dark:text-green-400" : "text-muted-foreground");

  if (deviceLower.includes("mobile")) return <Phone className={iconClass} />;
  if (deviceLower.includes("tablet")) return <Tablet className={iconClass} />;
  return <Laptop className={iconClass} />;
}

export default function SessionItem({ session, onDelete, isDeleting }: SessionItemProps) {
  const { t } = useTranslation(["setting"]);
  const lastActive = formatDistanceToNow(new Date(session.loginAt), { addSuffix: true });
  const expiresIn = formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true });

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 border rounded-lg transition-colors",
        session.isCurrent
          ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
          : "hover:bg-muted/50",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg shrink-0",
          session.isCurrent ? "bg-green-100 dark:bg-green-900/40" : "bg-muted",
        )}
      >
        {renderDeviceIcon(session.deviceInfo.device, session.isCurrent)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">
            {session.deviceInfo.browser} on {session.deviceInfo.os}
          </p>
          {session.isCurrent && (
            <Badge className="shrink-0 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800 hover:bg-green-100">
              {t("setting:sessionCurrentBadge")}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("setting:sessionLastActive", { time: lastActive })}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{t("setting:sessionExpires", { time: expiresIn })}</p>
      </div>

      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(session.id)}
          disabled={isDeleting}
          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("setting:sessionLogoutPending")}
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              {t("setting:sessionLogout")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
