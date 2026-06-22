// src/pages/InspectionRequestPrintPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { useInspectionRequest } from "@/features/inspection-requests/inspection-requests.query";
import { TEST_TYPE_LABELS, OBJECT_TYPE_LABELS } from "@/features/inspection-requests/inspection-request.constants";
import type { InspectionObjectType } from "@/features/inspection-requests/inspection-requests.api";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex text-[11px]">
      <span className="w-32 shrink-0 font-semibold uppercase">{label}</span>
      <span className="mr-1">:</span>
      <span className="flex-1">{value || "-"}</span>
    </div>
  );
}

export default function InspectionRequestPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: req, isLoading, isError, refetch } = useInspectionRequest(id!);

  useEffect(() => {
    if (req) document.title = `Request Form — ${req.requestNo}`;
    return () => {
      document.title = "Pantau Inspeksi";
    };
  }, [req]);

  if (isLoading) return <LoadingState />;
  if (isError || !req) return <ErrorState message="Failed to load inspection request." onRetry={() => refetch()} />;

  const sketch = req.attachments.find((a) => a.attachmentType === "SKETCH");
  const inspectionLogo = req.tank?.inspectionCompany?.logoFile?.url ?? null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; }
        }
        @page { size: A4 portrait; margin: 12mm; }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-6">
        <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", req.id))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>

        <div className="print-page mx-auto w-[210mm] bg-white p-8 shadow-lg">
          <div className="border-2 border-black">
            {/* Header */}
            <div className="flex items-stretch border-b-2 border-black">
              <div className="flex-1 border-r-2 border-black p-3">
                <p className="text-sm font-bold uppercase leading-tight">Stationary Inspection Engineer</p>
                <p className="text-xs font-semibold uppercase">PT. Pertamina RU-III</p>
              </div>
              <div className="w-56 p-3 text-right">
                {inspectionLogo ? <img src={inspectionLogo} alt="logo" className="ml-auto h-8 object-contain" /> : <p className="text-base font-bold text-red-600">PERTAMINA</p>}
                <p className="mt-1 text-[11px]">
                  {req.tank?.location ? `${req.tank.location}, ` : "Plaju, "}
                  {format(new Date(req.requestDate), "dd MMMM yyyy")}
                </p>
              </div>
            </div>

            {/* Info table */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="space-y-1 border-r-2 border-black p-3">
                <InfoCell label="User" value={req.requestedByUser?.name} />
                <InfoCell label="Customer / Asset Holder" value={req.assetHolder} />
                <InfoCell label="Execution / 3rd Party" value={req.executionParty} />
              </div>
              <div className="space-y-1 p-3">
                <InfoCell label="Request No." value={req.requestNo} />
                <InfoCell label="NDT Type" value={TEST_TYPE_LABELS[req.testType] ?? req.testType} />
                <InfoCell label="Standard & Code" value={req.standardAndCode} />
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-2">
              {/* Left: description */}
              <div className="border-r-2 border-black p-3" style={{ minHeight: "150mm" }}>
                <p className="mb-2 text-[11px] font-semibold uppercase">Work Instruction</p>
                <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed">{req.description ?? "-"}</pre>
                {req.items.length > 0 && !req.description && (
                  <ul className="mt-2 list-decimal pl-4 text-[11px]">
                    {req.items.map((it) => (
                      <li key={it.id}>
                        {OBJECT_TYPE_LABELS[it.objectType as InspectionObjectType] ?? it.objectType}
                        {it.objectName ? ` ${it.objectName}` : ""} — {it.quantity} {it.unit ?? "Pcs"}
                        {it.locationDetail ? ` (${it.locationDetail})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Right: sketch + remarks */}
              <div className="flex flex-col">
                <div className="flex-1 border-b-2 border-black p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase">Sketch</p>
                  {sketch ? <img src={sketch.attachmentUrl} alt="sketch" className="max-h-[80mm] w-full object-contain" /> : <div className="h-[80mm]" />}
                </div>
                <div className="p-3" style={{ minHeight: "55mm" }}>
                  <p className="mb-2 text-[11px] font-semibold uppercase">Remarks</p>
                  <p className="text-[11px]">{req.requestLocation ?? req.remarks ?? "-"}</p>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 border-t-2 border-black">
              {req.signatoryTemplate.map((role, idx) => (
                <div key={role} className={`p-3 text-center ${idx < 2 ? "border-r-2 border-black" : ""}`}>
                  <p className="text-[11px] font-semibold uppercase">{role}</p>
                  <div className="h-16" />
                  <div className="mx-auto w-3/4 border-t border-black pt-1 text-[10px] text-gray-500">Name &amp; Signature</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
