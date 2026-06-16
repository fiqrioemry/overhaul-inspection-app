// src/components/common/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  BANNED: { label: "Banned", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  OPEN: { label: "Open", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  IN_REPAIR: { label: "In Repair", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CLOSE: { label: "Closed", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  REVIEWED: { label: "Reviewed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  RETURNED: { label: "Returned", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const label = config?.label ?? (status ? status.replace(/_/g, " ") : "Unknown");
  const className = config?.className ?? "bg-gray-100 text-gray-600";

  return (
    <Badge variant="outline" className={cn("border-0 font-medium", className)}>
      {label}
    </Badge>
  );
}
