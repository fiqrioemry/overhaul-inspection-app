// src/pages/InspectionRequestDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import ReviewDialog from "@/features/inspection-requests/components/ReviewDialog";
import { useInspectionRequest, useCancelInspectionRequest } from "@/features/inspection-requests/inspection-requests.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-44 shrink-0">{label}</span>
      <span className="flex-1">{value ?? "—"}</span>
    </div>
  );
}

export default function InspectionRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const { data: req, isLoading, isError, refetch } = useInspectionRequest(requestId!);
  const cancelMutation = useCancelInspectionRequest();

  if (isLoading) return <LoadingState />;
  if (isError || !req) return <ErrorState message="Failed to load inspection request." onRetry={() => refetch()} />;

  const canCancel = req.status === "SUBMITTED";
  const canReview = req.status === "SUBMITTED";
  const tankPath = ROUTES.TANK_DETAIL.replace(":tankId", req.tankProcess.tank.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUESTS)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Requests
        </Button>
      </div>

      <PageHeader
        title={req.title}
        description={`Request No. ${req.requestNo}`}
        action={
          <div className="flex items-center gap-2">
            {canReview && (
              <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_REVIEW}>
                <Button onClick={() => setReviewOpen(true)}>Mark as Reviewed</Button>
              </PermissionGate>
            )}
            {canCancel && (
              <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE}>
                <Button variant="outline" onClick={() => setCancelConfirmOpen(true)}>
                  <X className="h-4 w-4 mr-1" /> Cancel Request
                </Button>
              </PermissionGate>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <StatusBadge status={req.status} />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <InfoRow label="Request No." value={<span className="font-mono">{req.requestNo}</span>} />
        <InfoRow label="Title" value={req.title} />
        <InfoRow label="Description" value={req.description} />
        <InfoRow
          label="Tank"
          value={
            <button onClick={() => navigate(tankPath)} className="text-primary underline text-sm">
              {req.tankProcess.tank.tankNo}
            </button>
          }
        />
        <InfoRow label="Process" value={req.tankProcess.processTemplate.name} />
        <InfoRow label="Process Code" value={<span className="font-mono">{req.tankProcess.processTemplate.code}</span>} />
        <InfoRow label="Status" value={<StatusBadge status={req.status} />} />
        <InfoRow label="Submitted By" value={req.submittedBy?.name} />
        <InfoRow
          label="Submitted At"
          value={format(new Date(req.submittedAt), "dd MMM yyyy HH:mm")}
        />
        {req.reviewedAt && (
          <>
            <InfoRow label="Reviewed By" value={req.reviewedBy?.name} />
            <InfoRow
              label="Reviewed At"
              value={format(new Date(req.reviewedAt), "dd MMM yyyy HH:mm")}
            />
          </>
        )}
        {req.notes && (
          <InfoRow label="Review Notes" value={<span className="whitespace-pre-wrap">{req.notes}</span>} />
        )}
      </div>

      <ReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} requestId={requestId!} />

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel Inspection Request"
        description="Cancel this inspection request? This action cannot be undone."
        confirmLabel="Cancel Request"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => {
          cancelMutation.mutate(requestId!, { onSuccess: () => setCancelConfirmOpen(false) });
        }}
      />
    </div>
  );
}
