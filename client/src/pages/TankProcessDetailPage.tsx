// src/pages/TankProcessDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ProcessStatusBadge from "@/components/common/ProcessStatusBadge";
import ProcessResultBadge from "@/components/common/ProcessResultBadge";
import PermissionGate from "@/components/common/PermissionGate";
import ChecklistTable from "@/features/checklist-results/components/ChecklistTable";
import EligibilityPanel from "@/features/tank-processes/components/EligibilityPanel";
import InspectionRequestForm from "@/features/inspection-requests/components/InspectionRequestForm";
import { useTankProcess, useUpdateProcessStatus } from "@/features/tank-processes/tank-processes.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import type { ProcessStatus } from "@/features/tank-processes/tank-processes.api";

const NEXT_STATUS: Partial<Record<ProcessStatus, ProcessStatus>> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "WAITING_REVIEW",
};

const STATUS_ACTION_LABEL: Partial<Record<ProcessStatus, string>> = {
  NOT_STARTED: "Start Process",
  IN_PROGRESS: "Submit for Review",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-44 shrink-0">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

export default function TankProcessDetailPage() {
  const { tankId, processId } = useParams<{ tankId: string; processId: string }>();
  const navigate = useNavigate();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data: process, isLoading, isError, refetch } = useTankProcess(processId!);
  const updateStatus = useUpdateProcessStatus();

  if (isLoading) return <LoadingState />;
  if (isError || !process) return <ErrorState message="Failed to load process." onRetry={() => refetch()} />;

  const tankPath = ROUTES.TANK_DETAIL.replace(":tankId", tankId!);
  const nextStatus = NEXT_STATUS[process.status];
  const actionLabel = STATUS_ACTION_LABEL[process.status];

  function handleStatusAdvance() {
    if (!nextStatus) return;
    updateStatus.mutate({ id: processId!, data: { status: nextStatus } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(tankPath)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tank
        </Button>
      </div>

      <PageHeader
        title={process.processTemplate.name}
        description={`${process.processTemplate.code} · ${process.processTemplate.type}`}
        action={
          <div className="flex items-center gap-2">
            {nextStatus && actionLabel && (
              <PermissionGate permission={PERMISSIONS.PROCESS_UPDATE}>
                <Button
                  variant="outline"
                  onClick={handleStatusAdvance}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? "Saving..." : actionLabel}
                </Button>
              </PermissionGate>
            )}
            {process.status === "IN_PROGRESS" && (
              <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_CREATE}>
                <Button onClick={() => setRequestDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-1" /> Submit Inspection Request
                </Button>
              </PermissionGate>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <ProcessStatusBadge status={process.status} />
        <ProcessResultBadge result={process.result} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="inspection">Inspection Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="rounded-lg border p-4 space-y-3">
            <InfoRow label="Process Code" value={<span className="font-mono">{process.processTemplate.code}</span>} />
            <InfoRow label="Process Name" value={process.processTemplate.name} />
            <InfoRow label="Type" value={process.processTemplate.type} />
            <InfoRow label="Sequence" value={process.processTemplate.sequenceOrder} />
            <InfoRow label="Optional" value={process.processTemplate.isOptional ? "Yes" : "No"} />
            <InfoRow label="Status" value={<ProcessStatusBadge status={process.status} />} />
            <InfoRow label="Result" value={<ProcessResultBadge result={process.result} />} />
            <InfoRow
              label="Started At"
              value={process.startedAt ? format(new Date(process.startedAt), "dd MMM yyyy HH:mm") : null}
            />
            <InfoRow
              label="Completed At"
              value={process.completedAt ? format(new Date(process.completedAt), "dd MMM yyyy HH:mm") : null}
            />
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <ChecklistTable processId={processId!} />
        </TabsContent>

        <TabsContent value="eligibility" className="mt-4">
          <EligibilityPanel processId={processId!} />
        </TabsContent>

        <TabsContent value="inspection" className="mt-4">
          <div className="space-y-4">
            <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_CREATE}>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setRequestDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-1" /> New Request
                </Button>
              </div>
            </PermissionGate>
            <p className="text-sm text-muted-foreground">
              Inspection requests for this process are listed on the{" "}
              <a href={ROUTES.INSPECTION_REQUESTS} className="underline">Inspection Requests</a> page.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="xl:h-auto! xl:w-110!">
          <div className="p-4">
            <DialogHeader>
              <DialogTitle>Submit Inspection Request</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <InspectionRequestForm
                tankProcessId={processId!}
                onSuccess={() => setRequestDialogOpen(false)}
                onCancel={() => setRequestDialogOpen(false)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
