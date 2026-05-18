// src/features/auth/components/PublicRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import AuthLoading from "@/components/common/AuthLoading";

export default function PublicRoute() {
  const { isLoading, isAuthenticated } = useAuthCheck();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo") || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
