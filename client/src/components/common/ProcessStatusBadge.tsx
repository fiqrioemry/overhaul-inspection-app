// src/components/common/ProcessStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PROCESS_STATUS_LABEL } from "@/constants/process.constant";
import type { ProcessStatus } from "@/features/tank-processes/tank-processes.api";

// Labels come from the shared constant so the badge and the status select cannot drift apart.
const statusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: PROCESS_STATUS_LABEL.NOT_STARTED, className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  IN_PROGRESS: { label: PROCESS_STATUS_LABEL.IN_PROGRESS, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  WAITING_REVIEW: { label: PROCESS_STATUS_LABEL.WAITING_REVIEW, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  REVIEWED: { label: PROCESS_STATUS_LABEL.REVIEWED, className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  COMPLETED: { label: PROCESS_STATUS_LABEL.COMPLETED, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
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
