import { Navigate, Outlet } from "react-router-dom";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useAuthStore } from "@/stores/auth.store";
import AuthLoading from "@/components/common/AuthLoading";

export default function AdminRoute() {
  const { isLoading, isAuthenticated } = useAuthCheck();
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    const path = window.location.pathname + window.location.search;
    const redirectTo = encodeURIComponent(path);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
