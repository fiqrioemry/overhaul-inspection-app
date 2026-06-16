// src/features/checklist-results/components/ChecklistTable.tsx
import { useState } from "react";
import { CheckCircle2, RotateCcw, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import ChecklistResultDialog from "./ChecklistResultDialog";
import AddCustomChecklistDialog from "./AddCustomChecklistDialog";
import { useChecklistResults, useBulkCheckChecklists, useResetChecklist } from "../checklist-results.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import type { ChecklistResult } from "../checklist-results.api";
import type { ProcessStatus } from "@/features/tank-processes/tank-processes.api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_CLASS: Record<string, string> = {
  NOT_CHECKED: "bg-gray-100 text-gray-600",
  PASSED: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_CHECKED: "Not Checked",
  PASSED: "Passed",
};

const STATUS_MESSAGE: Partial<Record<ProcessStatus, string>> = {
  NOT_STARTED: "Start the process to begin checking items.",
  WAITING_REVIEW: "Process is under review. Checklist is read-only.",
  REVIEWED: "Process is reviewed. Checklist is read-only.",
  COMPLETED: "Process is completed. Checklist is read-only.",
  LOCKED: "Process is locked.",
};

interface ChecklistTableProps {
  processId: string;
  processStatus: ProcessStatus;
}

export default function ChecklistTable({ processId, processStatus }: ChecklistTableProps) {
  const { data: results, isLoading, isError, refetch } = useChecklistResults(processId);
  const bulkCheck = useBulkCheckChecklists(processId);
  const resetOne = useResetChecklist(processId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checkTarget, setCheckTarget] = useState<ChecklistResult | null>(null);
  const [resetTarget, setResetTarget] = useState<ChecklistResult | null>(null);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const isEditable = processStatus === "IN_PROGRESS";

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load checklist." onRetry={() => refetch()} />;
  if (!results?.length) return <EmptyState title="No checklist items" description="No acceptance criteria linked to this process." />;

  const notCheckedIds = results.filter((r) => r.status === "NOT_CHECKED").map((r) => r.id);
  const allNotCheckedSelected = notCheckedIds.length > 0 && notCheckedIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    setSelectedIds(allNotCheckedSelected ? new Set() : new Set(notCheckedIds));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkCheck() {
    bulkCheck.mutate({ checklistIds: [...selectedIds] }, { onSuccess: () => setSelectedIds(new Set()) });
  }

  const statusMessage = STATUS_MESSAGE[processStatus];

  return (
    <>
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 mb-3">
          <Info className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{results.length} item(s)</span>
          {isEditable && selectedIds.size > 0 && (
            <PermissionGate permission={PERMISSIONS.CHECKLIST_UPDATE}>
              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={handleBulkCheck} disabled={bulkCheck.isPending}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {bulkCheck.isPending ? "Checking..." : `Mark ${selectedIds.size} as Passed`}
              </Button>
            </PermissionGate>
          )}
        </div>
        {isEditable && (
          <PermissionGate permission={PERMISSIONS.CHECKLIST_UPDATE}>
            <Button size="sm" variant="outline" onClick={() => setCustomDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Custom
            </Button>
          </PermissionGate>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-240">
          <thead className="border-b bg-muted/40">
            <tr>
              {isEditable && (
                <th className="px-4 py-3 w-10">
                  <Checkbox checked={allNotCheckedSelected} onCheckedChange={toggleAll} aria-label="Select all not-checked" disabled={notCheckedIds.length === 0} />
                </th>
              )}
              <th className="px-4 py-3 text-left font-medium">Parameter</th>
              <th className="px-4 py-3 text-left font-medium">Acceptance</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">Remarks</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Checked By</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isPassed = item.status === "PASSED";
              return (
                <tr key={item.id} className={cn("hover:bg-muted/20", isSelected && "bg-muted/30")}>
                  {isEditable && <td className="px-4 py-3">{!isPassed && <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(item.id)} aria-label={`Select ${item.nameDisplay}`} />}</td>}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{item.nameDisplay}</span>
                      {item.source === "CUSTOM" && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-purple-300 text-purple-600">
                          Custom
                        </Badge>
                      )}
                      {item.isRequired && (
                        <span className="text-red-500 text-xs font-bold" title="Required">
                          *
                        </span>
                      )}
                    </div>
                    {/* {item.criteria?.code && <div className="text-xs text-muted-foreground mt-0.5">{item.criteria.code}</div>} */}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-50">{item.acceptanceDisplay}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.methodDisplay}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.referenceDisplay}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground italic">{item.remarks ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("border-0 font-medium text-xs", STATUS_CLASS[item.status])}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.checkedBy ? (
                      <>
                        <div>{item.checkedBy.name}</div>
                        {item.checkedAt && <div className="text-xs opacity-70">{format(new Date(item.checkedAt), "dd MMM yyyy")}</div>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditable && (
                      <PermissionGate permission={PERMISSIONS.CHECKLIST_UPDATE}>
                        <div className="flex items-center gap-1 justify-end">
                          {!isPassed && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setCheckTarget(item)} title="Mark as Passed" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isPassed && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setResetTarget(item)} title="Reset to Not Checked" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </PermissionGate>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ChecklistResultDialog
        open={Boolean(checkTarget)}
        onOpenChange={(open) => {
          if (!open) setCheckTarget(null);
        }}
        result={checkTarget}
        processId={processId}
      />

      <ConfirmDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        title="Reset Checklist Item"
        description={`Reset "${resetTarget?.nameDisplay}" back to NOT CHECKED? The checked-by record will be cleared.`}
        confirmLabel="Reset"
        variant="destructive"
        loading={resetOne.isPending}
        onConfirm={() => {
          if (!resetTarget) return;
          resetOne.mutate(resetTarget.id, { onSuccess: () => setResetTarget(null) });
        }}
      />

      <AddCustomChecklistDialog open={customDialogOpen} onOpenChange={setCustomDialogOpen} processId={processId} />
    </>
  );
}
