/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/settings/components/SessionList.tsx
import { useState } from "react";
import SessionItem from "./SessionItem";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SessionWithCurrent } from "@/types/sessions.type";
import { useSessions, useDeleteSession, useLogoutAll } from "@/features/auth/auth.query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Parse user agent to extract device info
function parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = "Unknown Browser";
  if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";

  // OS detection
  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("ios") || ua.includes("iphone")) os = "iOS";

  // Device detection
  let device = "Desktop";
  if (ua.includes("mobile")) device = "Mobile";
  else if (ua.includes("tablet")) device = "Tablet";

  return { browser, os, device };
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
      isCurrent: false, // Backend should determine this
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
    // User will be redirected by the mutation
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("setting:sessionsTitle")}</CardTitle>
          <CardDescription>{t("setting:sessionsDescription")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("setting:noActiveSessions")}</p>
          ) : (
            sessions.map((session) => <SessionItem key={session.id} session={session} onDelete={handleDeleteSession} isDeleting={deletingSessionId === session.id} />)
          )}
        </CardContent>

        {sessions.length > 1 && (
          <CardFooter className="border-t pt-6">
            <Button variant="destructive" onClick={() => setShowLogoutAll(true)} disabled={logoutAll.isPending}>
              {logoutAll.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              {t("setting:logoutAllButton")}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Logout All Confirmation Dialog */}
      <AlertDialog open={showLogoutAll} onOpenChange={setShowLogoutAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("setting:logoutAllDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("setting:logoutAllDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("setting:cancelButton")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("setting:logoutAllConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
