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
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    fetchMe()
      .then((user) => {
        setUser(user);

        queryClient.setQueryData(AUTH_KEYS.me, user);
        navigate("/", { replace: true });
      })
      .catch(() => {
        navigate("/login?error=oauth_failed", { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm">Completing login...</p>
    </div>
  );
}
