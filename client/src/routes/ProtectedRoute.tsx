import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/auth.store";

export default function ProtectedRoute() {
  const path = window.location.pathname;
  const queryParam = new URLSearchParams(window.location.search);
  const redirectTo = queryParam.get("redirectTo") || path;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to={"/login?redirectTo=" + redirectTo} replace />;
}
