// src/components/common/ProcessResultBadge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProcessResult } from "@/features/tank-processes/tank-processes.api";

const resultConfig: Record<ProcessResult, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  PASSED: { label: "Passed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  NOT_APPLICABLE: { label: "N/A", className: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500" },
};

interface ProcessResultBadgeProps {
  result: ProcessResult;
}

export default function ProcessResultBadge({ result }: ProcessResultBadgeProps) {
  const config = resultConfig[result] ?? { label: result.replace(/_/g, " "), className: "bg-gray-100 text-gray-600" };
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
