// src/features/inspection-requests/components/TestRecordSection.tsx
import { useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TestRecordFormDialog from "@/features/test-records/components/TestRecordFormDialog";
import { useTestRecordsByRequest, useDeleteTestRecord } from "@/features/test-records/test-records.query";
import type { TestRecord } from "@/features/test-records/test-records.api";
import { TEST_RESULT_STATUS_LABELS, OBJECT_TYPE_LABELS } from "../inspection-request.constants";
import type { InspectionRequestItem, InspectionRequestStatus, InspectionObjectType } from "../inspection-requests.api";

const STATUS_CLASS: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  REPAIR: "bg-amber-100 text-amber-800",
  PASSED: "bg-green-100 text-green-700",
};

interface TestRecordSectionProps {
  requestId: string;
  requestStatus: InspectionRequestStatus;
  items: InspectionRequestItem[];
  canManage: boolean;
  isAdmin: boolean;
}

export default function TestRecordSection({ requestId, requestStatus, items, canManage, isAdmin }: TestRecordSectionProps) {
  const { data: records = [], isLoading } = useTestRecordsByRequest(requestId);
  const deleteMutation = useDeleteTestRecord(requestId);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TestRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestRecord | null>(null);

  const objectOptions = items.map((it) => ({
    value: it.id,
    label: `${OBJECT_TYPE_LABELS[it.objectType as InspectionObjectType] ?? it.objectType}${it.objectName ? ` — ${it.objectName}` : ""}`,
  }));

  const lockedNotStarted = requestStatus === "NOT_STARTED";
  const lockedPassed = requestStatus === "PASSED" && !isAdmin;
  const readOnly = lockedNotStarted || lockedPassed || !canManage;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Test Records {records.length > 0 && <span className="text-muted-foreground">({records.length})</span>}</h3>
        {!readOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditRecord(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Result
          </Button>
        )}
      </div>

      {lockedNotStarted && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Test record can only be added after the signed request form has been uploaded and the request status is IN_PROCESS.
        </div>
      )}
      {lockedPassed && <p className="text-xs text-muted-foreground">This request is PASSED — test records are read-only.</p>}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : records.length === 0 ? (
        <EmptyState title="No test records" description="Results recorded against this request will appear here." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Object</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Remarks</th>
                <th className="px-3 py-2 text-left font-medium">Photos</th>
                {!readOnly && <th className="px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded", STATUS_CLASS[r.status])}>{TEST_RESULT_STATUS_LABELS[r.status] ?? r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.inspectionRequestItem
                      ? `${OBJECT_TYPE_LABELS[r.inspectionRequestItem.objectType as InspectionObjectType] ?? r.inspectionRequestItem.objectType}${r.inspectionRequestItem.objectName ? ` — ${r.inspectionRequestItem.objectName}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.testDate ? format(new Date(r.testDate), "dd MMM yyyy") : "—"}</td>
                  <td className="px-3 py-2 text-xs max-w-xs">
                    <span className="line-clamp-2">{r.remarks ?? "—"}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.attachments.length}</td>
                  {!readOnly && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditRecord(r);
                            setFormOpen(true);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(r)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TestRecordFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditRecord(null);
        }}
        inspectionRequestId={requestId}
        objectOptions={objectOptions}
        record={editRecord ?? undefined}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Test Record"
        description="This will permanently remove the test record. Continue?"
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </div>
  );
}
