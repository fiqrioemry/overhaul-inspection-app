// src/features/auth/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import AuthLoading from "@/components/common/AuthLoading";

export default function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuthCheck();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    const path = window.location.pathname + window.location.search;
    const redirectTo = encodeURIComponent(path);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  return <Outlet />;
}
