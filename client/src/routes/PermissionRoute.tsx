// src/routes/PermissionRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/route.constant";

interface PermissionRouteProps {
  permission: string | string[];
  mode?: "any" | "all";
}

export default function PermissionRoute({ permission, mode = "any" }: PermissionRouteProps) {
  const can = useAuthStore((s) => s.can);
  const canAny = useAuthStore((s) => s.canAny);
  const canAll = useAuthStore((s) => s.canAll);

  const perms = Array.isArray(permission) ? permission : [permission];
  const hasAccess = perms.length === 1 ? can(perms[0]) : mode === "all" ? canAll(perms) : canAny(perms);

  if (!hasAccess) return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  return <Outlet />;
}
