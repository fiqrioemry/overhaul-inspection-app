// src/pages/InspectionRequestPrintPage.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { useInspectionRequest } from "@/features/inspection-requests/inspection-requests.query";
import { isLegacyPrintTestType } from "@/features/inspection-requests/inspection-request.constants";
import LegacyInspectionRequestPrintForm from "@/features/inspection-requests/components/LegacyInspectionRequestPrintForm";
import NdeClearancePrintForm from "@/features/inspection-requests/components/NdeClearancePrintForm";

export default function InspectionRequestPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { data: req, isLoading, isError, refetch } = useInspectionRequest(id!);

  useEffect(() => {
    if (req) document.title = `Request Form — ${req.requestNo}`;
    return () => {
      document.title = "Pantau Inspeksi";
    };
  }, [req]);

  if (isLoading) return <LoadingState />;
  if (isError || !req) return <ErrorState message="Failed to load inspection request." onRetry={() => refetch()} />;

  // PT/RT keep the original A4 portrait request form; every other test type
  // prints the A4 landscape NDE Clearance form.
  if (isLegacyPrintTestType(req.testType)) {
    return <LegacyInspectionRequestPrintForm req={req} />;
  }

  return <NdeClearancePrintForm req={req} />;
}
