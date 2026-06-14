// src/components/common/PermissionGate.tsx
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";

interface PermissionGateProps {
  permission: string | string[];
  mode?: "any" | "all";
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGate({ permission, mode = "any", fallback = null, children }: PermissionGateProps) {
  const can = useAuthStore((s) => s.can);
  const canAny = useAuthStore((s) => s.canAny);
  const canAll = useAuthStore((s) => s.canAll);

  const perms = Array.isArray(permission) ? permission : [permission];
  const hasAccess = perms.length === 1 ? can(perms[0]) : mode === "all" ? canAll(perms) : canAny(perms);

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}
