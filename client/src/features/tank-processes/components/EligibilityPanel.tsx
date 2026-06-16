// src/features/tank-processes/components/EligibilityPanel.tsx
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import { useProcessEligibility } from "../tank-processes.query";
import { cn } from "@/lib/utils";

interface EligibilityPanelProps {
  processId: string;
}

export default function EligibilityPanel({ processId }: EligibilityPanelProps) {
  const { data, isLoading, isError, refetch } = useProcessEligibility(processId);

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <AlertCircle className="h-4 w-4" />
        <span>Could not load eligibility data.</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className={cn(
        "flex items-center gap-3 rounded-lg p-4 border",
        data.eligible
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
          : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900",
      )}>
        {data.eligible ? (
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
        )}
        <div>
          <p className={cn(
            "font-semibold text-sm",
            data.eligible ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400",
          )}>
            {data.eligible ? "Eligible for Inspection Request" : "Not Eligible"}
          </p>
          {!data.eligible && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Resolve the issues below before submitting an inspection request.
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {data.reasons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Blocking Issues</p>
          <ul className="space-y-2">
            {data.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>{reason.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
