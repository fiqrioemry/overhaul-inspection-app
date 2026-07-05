// src/pages/InspectionRequestEditPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import InspectionRequestForm from "@/features/inspection-requests/components/InspectionRequestForm";
import { useInspectionRequest } from "@/features/inspection-requests/inspection-requests.query";
import { ROUTES } from "@/constants/route.constant";

export default function InspectionRequestEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: req, isLoading, isError, refetch } = useInspectionRequest(id!);

  if (isLoading) return <LoadingState />;
  if (isError || !req) return <ErrorState message="Failed to load inspection request." onRetry={() => refetch()} />;

  const detailPath = ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", req.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(detailPath)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            Edit Inspection Request <span className="font-mono">{req.requestNo}</span>
          </h1>
          <p className="text-xs text-muted-foreground">Update the digital inspection/test request form</p>
        </div>
      </div>

      {req.status !== "NOT_STARTED" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This request has already been confirmed and can no longer be edited. Only requests with status <span className="font-medium">Not Started</span> are editable.
        </div>
      ) : (
        <InspectionRequestForm request={req} />
      )}
    </div>
  );
}
