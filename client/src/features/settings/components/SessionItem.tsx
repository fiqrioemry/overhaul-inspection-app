// src/features/settings/components/SessionItem.tsx
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { SessionWithCurrent } from "@/types/sessions.type";
import { Laptop, Loader2, LogOut, Phone, Tablet } from "lucide-react";

interface SessionItemProps {
  session: SessionWithCurrent;
  onDelete: (sessionId: string) => void;
  isDeleting: boolean;
}

function renderDeviceIcon(device: string) {
  const deviceLower = device.toLowerCase();
  if (deviceLower.includes("mobile")) {
    return <Phone className="h-5 w-5 text-muted-foreground" />;
  }
  if (deviceLower.includes("tablet")) {
    return <Tablet className="h-5 w-5 text-muted-foreground" />;
  }
  return <Laptop className="h-5 w-5 text-muted-foreground" />;
}

export default function SessionItem({ session, onDelete, isDeleting }: SessionItemProps) {
  const { t } = useTranslation(["setting"]);
  const lastActive = formatDistanceToNow(new Date(session.loginAt), { addSuffix: true });

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Device Icon */}
      <div className="p-2 rounded-lg bg-muted">{renderDeviceIcon(session.deviceInfo.device)}</div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">
            {session.deviceInfo.browser} on {session.deviceInfo.os}
          </p>
          {session.isCurrent && (
            <Badge variant="secondary" className="shrink-0">
              {t("setting:sessionCurrentBadge")}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t("setting:sessionLastActive", { time: lastActive })}</p>
        {session.deviceInfo.device && <p className="text-xs text-muted-foreground mt-0.5">{session.deviceInfo.device}</p>}
      </div>

      {/* Delete Button */}
      {!session.isCurrent && (
        <Button variant="ghost" size="sm" onClick={() => onDelete(session.id)} disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
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
