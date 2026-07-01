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
  const inspectionLogo = req.inspectionLogoUrl ?? req.approvedByUser?.company?.logoFile?.url ?? null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-wrap { background: white !important; margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 12mm !important; width: 210mm !important; }
        }
        /* margin: 0 removes the browser's auto header/footer (date, title, URL) */
        @page { size: A4 portrait; margin: 0; }
      `}</style>

      <div className="print-wrap min-h-screen bg-gray-100 py-6">
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
            <div className="relative flex items-stretch border-b-2 border-black">
              {/* Logo sits on the right and defines the header height (position unchanged) */}
              <div className="ml-auto w-56 px-2 py-2 flex flex-col items-center justify-center text-center">
                {inspectionLogo ? <img src={inspectionLogo} alt="logo" className="h-16 w-full object-contain" /> : <p className="text-base font-bold text-red-600">PERTAMINA</p>}
                <p className="mt-1 text-[9px]">
                  {req.tank?.location ? `${req.tank.location}, ` : "Plaju, "}
                  {format(new Date(req.requestDate), "dd MMMM yyyy")}
                </p>
              </div>
              {/* Title centered across the full header width (logo area included) */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                <p className="-mt-0.5 text-base font-bold uppercase leading-tight">Stationary Inspection Engineer</p>
                <p className="text-xs font-semibold uppercase">PT. Pertamina RU-III</p>
              </div>
            </div>

            {/* Info table */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="flex border-b border-r-2 border-black text-[10px]">
                <span className="w-44 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">User</span>
                <span className="flex-1 px-2 py-1">Stat. Ins. Eng</span>
              </div>
              <div className="flex border-b border-black text-[10px]">
                <span className="w-36 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">Request No.</span>
                <span className="flex-1 px-2 py-1">{`_ /NDT/SSIE/${new Date().getFullYear()}`}</span>
              </div>
              <div className="flex border-b border-r-2 border-black text-[10px]">
                <span className="w-44 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">Customer / Asset Holder</span>
                <span className="flex-1 px-2 py-1">MA</span>
              </div>
              <div className="flex border-b border-black text-[10px]">
                <span className="w-36 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">NDT Type</span>
                <span className="flex-1 px-2 py-1">{TEST_TYPE_LABELS[req.testType] ?? req.testType}</span>
              </div>
              <div className="flex border-r-2 border-black text-[10px]">
                <span className="w-44 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">Executor / 3rd Party</span>
                <span className="flex-1 px-2 py-1 uppercase">{req.executionCompany?.name || req.executionParty || "-"}</span>
              </div>
              <div className="flex text-[10px]">
                <span className="w-36 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">Standard & Code</span>
                <span className="flex-1 px-2 py-1">{req.standardAndCode || "-"}</span>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-[3fr_2fr]">
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
              <div className="border-r-2 border-black text-center">
                <p className="px-2 py-1 text-start text-[11px] border-b font-semibold uppercase">Received By :</p>
                {req.receivedByUser?.company?.name && <p className="px-2 py-1 text-start text-[9px] text-black">{req.receivedByUser.company.name}</p>}
                <div className="h-14" />
                <div className="mx-auto w-3/4 border-t border-black pt-1 text-[10px] text-black">{req.receivedByUser?.name}</div>
              </div>
              <div className="border-r-2 border-black text-center">
                <p className="px-2 py-1 text-[11px] text-start font-semibold uppercase border-b border-black">Prepared By :</p>
                {req.preparedByUser?.position && <p className="px-2 py-1 text-start text-[9px] text-black">{req.preparedByUser.position}</p>}
                <div className="h-14" />
                <div className="mx-auto w-3/4 border-t border-black pt-1 text-[10px] text-black">{req.preparedByUser?.name}</div>
              </div>
              <div className=" text-center">
                <p className="px-2 py-1 text-[11px] text-start font-semibold uppercase border-b border-black">Approved By :</p>
                {req.approvedByUser?.position && <p className="px-2 py-1 text-start text-[9px] text-black">{req.approvedByUser.position}</p>}
                <div className="h-14" />
                <div className="mx-auto w-3/4 border-t border-black pt-1 text-[10px] text-black">{req.approvedByUser?.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
