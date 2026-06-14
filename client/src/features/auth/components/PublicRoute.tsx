// src/features/auth/components/PublicRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/features/auth/auth.query";
import AuthLoading from "@/components/common/AuthLoading";

export default function PublicRoute() {
  const { isLoading } = useMe();
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading || !isBootstrapped) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo") || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
