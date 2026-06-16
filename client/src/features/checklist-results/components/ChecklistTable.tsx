// src/features/checklist-results/components/ChecklistTable.tsx
import { useState } from "react";
import { Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import PermissionGate from "@/components/common/PermissionGate";
import ChecklistResultDialog from "./ChecklistResultDialog";
import { useChecklistResults } from "../checklist-results.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import type { ChecklistResult } from "../checklist-results.api";
import { cn } from "@/lib/utils";

const statusClass: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  NOT_APPLICABLE: "bg-gray-100 text-gray-400",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  NOT_APPLICABLE: "N/A",
};

interface ChecklistTableProps {
  processId: string;
}

export default function ChecklistTable({ processId }: ChecklistTableProps) {
  const { data: results, isLoading, isError, refetch } = useChecklistResults(processId);
  const [editTarget, setEditTarget] = useState<ChecklistResult | null>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load checklist." onRetry={() => refetch()} />;
  if (!results?.length) return <EmptyState title="No checklist items" description="No acceptance criteria linked to this process." />;

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Parameter</th>
              <th className="px-4 py-3 text-left font-medium">Acceptance</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">Actual</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Checked By</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((item) => (
              <tr key={item.id} className={cn("hover:bg-muted/20", item.status === "FAILED" && "bg-red-50/40 dark:bg-red-950/20")}>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.criteria.name}</div>
                  <div className="text-xs text-muted-foreground">{item.criteria.code}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px]">{item.criteria.acceptanceValue ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{item.criteria.method ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {item.criteria.referenceDocument ? (
                    <span className="font-mono">{item.criteria.referenceDocument.code}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {item.actualValue ?? <span className="text-muted-foreground">—</span>}
                  {item.remarks && <div className="text-muted-foreground mt-0.5 italic">{item.remarks}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("border-0 font-medium text-xs", statusClass[item.status])}>
                    {statusLabel[item.status] ?? item.status}
                  </Badge>
                  {item.status === "FAILED" && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{item.checkedBy ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <PermissionGate permission={PERMISSIONS.CHECKLIST_UPDATE}>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(item)}>
                      <Pencil />
                    </Button>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChecklistResultDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        result={editTarget}
        processId={processId}
      />
    </>
  );
}
