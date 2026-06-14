// src/features/auth/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useMe } from "@/features/auth/auth.query";
import AuthLoading from "@/components/common/AuthLoading";

export default function ProtectedRoute() {
  const { isLoading } = useMe();
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading || !isBootstrapped) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    const path = window.location.pathname + window.location.search;
    const redirectTo = encodeURIComponent(path);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  return <Outlet />;
}
