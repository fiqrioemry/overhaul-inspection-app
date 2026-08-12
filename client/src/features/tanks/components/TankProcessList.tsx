// src/features/tanks/components/TankProcessList.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProcessStatusBadge from "@/components/common/ProcessStatusBadge";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import PermissionGate from "@/components/common/PermissionGate";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import AddProcessDialog from "@/features/tank-projects/components/AddProcessDialog";
import { useTankProcesses, useDeleteTankProcess, useCompleteProcessDirect } from "@/features/tank-processes/tank-processes.query";
import type { TankProcessSummary, ProcessStatus } from "@/features/tank-processes/tank-processes.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

// Statuses eligible for the "Mark as Completed" shortcut — must mirror the server's
// DIRECT_COMPLETE_ELIGIBLE_STATUSES (server/src/modules/tank-processes/tank-process.service.ts).
// This is only a UX affordance; the server is the source of truth for what's actually allowed.
const DIRECT_COMPLETE_ELIGIBLE_STATUSES: ProcessStatus[] = ["NOT_STARTED", "IN_PROGRESS", "WAITING_REVIEW", "REVIEWED"];

interface TankProcessListProps {
  tankId: string;
  projectId?: string | null;
}

export default function TankProcessList({ tankId, projectId }: TankProcessListProps) {
  const { data: processes, isLoading, isError, refetch } = useTankProcesses(tankId);
  const deleteMutation = useDeleteTankProcess();
  const completeMutation = useCompleteProcessDirect();
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TankProcessSummary | null>(null);
  const [completeTarget, setCompleteTarget] = useState<TankProcessSummary | null>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load processes." onRetry={() => refetch()} />;

  return (
    <div className="space-y-3">
      {projectId && (
        <div className="flex justify-end">
          <PermissionGate permission={PERMISSIONS.TANK_PROJECT_UPDATE}>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Process
            </Button>
          </PermissionGate>
        </div>
      )}

      {!processes?.length ? (
        <EmptyState title="No processes found" description="This tank has no process list yet." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Seq</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Process</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Checklist</th>
                <th className="px-4 py-3 text-left font-medium">Findings</th>
                <th className="px-4 py-3 text-left font-medium">Started</th>
                <th className="px-4 py-3 text-left font-medium">Completed</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {processes.map((proc) => {
                const detailPath = ROUTES.PROCESS_DETAIL.replace(":tankId", tankId).replace(":processId", proc.id);
                return (
                  <tr key={proc.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">{proc.sequenceOrder}</td>
                    <td className="px-4 py-3 font-mono text-xs">{proc.processTemplate.code}</td>
                    <td className="px-4 py-3 font-medium">
                      {proc.name}
                      {proc.processTemplate.isOptional && <span className="ml-1 text-xs text-muted-foreground">(optional)</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{proc.type}</td>
                    <td className="px-4 py-3">
                      <ProcessStatusBadge status={proc.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{proc._count.checklistResults}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{proc._count.findings}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{proc.startDate ? format(new Date(proc.startDate), "dd MMM yyyy") : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{proc.finishDate ? format(new Date(proc.finishDate), "dd MMM yyyy") : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {proc.status === "NOT_STARTED" && (
                          <PermissionGate permission={PERMISSIONS.PROCESS_DELETE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => setRemoveTarget(proc)} title="Remove process">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </PermissionGate>
                        )}
                        {DIRECT_COMPLETE_ELIGIBLE_STATUSES.includes(proc.status) && (
                          <PermissionGate permission={PERMISSIONS.PROCESS_UPDATE}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setCompleteTarget(proc)}
                              title="Mark as Completed"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          </PermissionGate>
                        )}
                        <Link to={detailPath} className="inline-flex items-center text-xs text-primary hover:underline">
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {projectId && <AddProcessDialog open={addOpen} onOpenChange={setAddOpen} projectId={projectId} />}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove Process"
        description={`Remove "${removeTarget?.name ?? ""}" from this project's process list? This cannot be undone.`}
        confirmLabel="Remove"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!removeTarget) return;
          deleteMutation.mutate(removeTarget.id, { onSuccess: () => setRemoveTarget(null) });
        }}
      />

      <ConfirmDialog
        open={Boolean(completeTarget)}
        onOpenChange={(open) => !open && setCompleteTarget(null)}
        title="Mark process as completed?"
        description="This process will be completed immediately without requiring the remaining checklist or review stages. Incomplete checklist items will not be changed."
        confirmLabel="Confirm"
        loading={completeMutation.isPending}
        onConfirm={() => {
          if (!completeTarget) return;
          completeMutation.mutate(completeTarget.id, { onSuccess: () => setCompleteTarget(null) });
        }}
      />
    </div>
  );
}
