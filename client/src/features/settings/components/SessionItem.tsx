// src/features/settings/components/SessionItem.tsx
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { SessionWithCurrent } from "@/types/sessions.type";
import { Loader2, LogOut, Phone } from "lucide-react";

interface SessionItemProps {
  session: SessionWithCurrent;
  onDelete: (sessionId: string) => void;
  isDeleting: boolean;
}

// function getDeviceIcon(device: string) {
//   if (device.toLowerCase().includes("mobile")) return Smartphone;
//   if (device.toLowerCase().includes("tablet")) return Tablet;
//   return Monitor;
// }

export default function SessionItem({ session, onDelete, isDeleting }: SessionItemProps) {
  //   const DeviceIcon = getDeviceIcon(session.deviceInfo.device);
  const lastActive = formatDistanceToNow(new Date(session.loginAt), { addSuffix: true });

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Device Icon */}
      <div className="p-2 rounded-lg bg-muted">
        <Phone className="h-6 w-6 text-muted-foreground" />
        {/* <DeviceIcon className="h-5 w-5 text-muted-foreground" /> */}
      </div>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">
            {session.deviceInfo.browser} on {session.deviceInfo.os}
          </p>
          {session.isCurrent && (
            <Badge variant="secondary" className="shrink-0">
              Current
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Last active {lastActive}</p>
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
              Log out
            </>
          )}
        </Button>
      )}
    </div>
  );
}
