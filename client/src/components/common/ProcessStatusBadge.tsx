// src/components/common/ProcessStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProcessStatus } from "@/features/tank-processes/tank-processes.api";

const statusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  LOCKED: { label: "Locked", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  NOT_STARTED: { label: "Not Started", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  WAITING_REVIEW: { label: "Waiting Review", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  REVIEWED: { label: "Reviewed", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  NOT_APPLICABLE: { label: "N/A", className: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500" },
};

interface ProcessStatusBadgeProps {
  status: ProcessStatus;
}

export default function ProcessStatusBadge({ status }: ProcessStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status.replace(/_/g, " "), className: "bg-gray-100 text-gray-600" };
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
