/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import SessionItem from "./SessionItem";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, MonitorSmartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SessionWithCurrent } from "@/types/sessions.type";
import { useSessions, useDeleteSession, useLogoutAll } from "@/features/auth/auth.query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
  const ua = userAgent.toLowerCase();

  let browser = "Unknown Browser";
  if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";

  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("ios") || ua.includes("iphone")) os = "iOS";

  let device = "Desktop";
  if (ua.includes("mobile")) device = "Mobile";
  else if (ua.includes("tablet")) device = "Tablet";

  return { browser, os, device };
}

function SessionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function SessionList() {
  const { t } = useTranslation(["setting"]);
  const [showLogoutAll, setShowLogoutAll] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const { data, isLoading } = useSessions();
  const deleteSession = useDeleteSession();
  const logoutAll = useLogoutAll();

  let sessions: SessionWithCurrent[] = [];
  if (Array.isArray(data?.data)) {
    sessions = data.data.map((session: any) => ({
      ...session,
      isCurrent: false,
      deviceInfo: parseUserAgent(session.userAgent),
    }));
  }

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    try {
      await deleteSession.mutateAsync(sessionId);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleLogoutAll = async () => {
    await logoutAll.mutateAsync();
    setShowLogoutAll(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("setting:sessionsTitle")}</CardTitle>
          <CardDescription>{t("setting:sessionsDescription")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <SessionSkeleton />
              <SessionSkeleton />
              <SessionSkeleton />
            </>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <MonitorSmartphone className="h-8 w-8 opacity-40" />
              <p className="text-sm">{t("setting:noActiveSessions")}</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onDelete={handleDeleteSession}
                isDeleting={deletingSessionId === session.id}
              />
            ))
          )}
        </CardContent>

        {sessions.length > 1 && (
          <CardFooter className="border-t pt-6">
            <Button variant="destructive" onClick={() => setShowLogoutAll(true)} disabled={logoutAll.isPending}>
              {logoutAll.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              {t("setting:logoutAllButton")}
            </Button>
          </CardFooter>
        )}
      </Card>

      <AlertDialog
        open={showLogoutAll}
        onOpenChange={(open) => {
          if (!open && !logoutAll.isPending) setShowLogoutAll(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("setting:logoutAllDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("setting:logoutAllDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logoutAll.isPending}>{t("setting:cancelButton")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              disabled={logoutAll.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {logoutAll.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("setting:logoutAllConfirmPending")}
                </>
              ) : (
                t("setting:logoutAllConfirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
