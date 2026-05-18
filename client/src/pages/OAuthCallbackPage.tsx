// src/pages/OAuthCallbackPage.tsx
//
// Backend redirect ke: /oauth/callback?success=true&provider=google
// atau                  /login?error=oauth_failed&provider=google
//
// Page ini hanya bertanggung jawab:
//   1. Fetch /auth/me untuk populate zustand store (cookie sudah di-set backend)
//   2. Redirect ke "/"

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { fetchMe } from "@/features/auth/auth.api";
import { AUTH_KEYS } from "@/features/auth/auth.query";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success") === "true";

    if (!success) {
      // Seharusnya tidak sampai sini karena backend redirect ke /login?error=...
      // Tapi sebagai safety net:
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    // Cookie session sudah di-set backend — tinggal fetch /me
    fetchMe()
      .then((user) => {
        setUser(user);
        // Populate query cache supaya useMe() tidak refetch
        queryClient.setQueryData(AUTH_KEYS.me, user);
        navigate("/", { replace: true });
      })
      .catch(() => {
        // Cookie tidak valid / expired
        navigate("/login?error=oauth_failed", { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm">Menyelesaikan login...</p>
    </div>
  );
}
