// src/hooks/useAuthCheck.ts
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/features/auth/auth.query";

export function useAuthCheck() {
  const { isLoading } = useMe();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return {
    isLoading,
    isAuthenticated,
    isReady: !isLoading,
  };
}
