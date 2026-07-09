// src/features/inspection-requests/components/NdeClearancePrintForm.tsx
// A4 landscape printable NDE Clearance form for non-NDT test types
// (hydrotest / pneumatic / oil leak / other). PENETRANT_TEST and
// RADIOGRAPHY_TEST keep LegacyInspectionRequestPrintForm.
import { useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEST_TYPE_LABELS } from "../inspection-request.constants";
import type { InspectionRequestDetail, InspectionFormTemplateInfo, InspectionRequestFormChecklistValue } from "../inspection-requests.api";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

type Props = {
  req: InspectionRequestDetail;
};

const DEFAULT_TITLE = "NDE CLEARANCE FORM";
const BLANK_CHECKLIST_ROWS = 8;

// Template rows may arrive as [{ label }] or plain strings; missing/empty
// templates fall back to blank fill-in rows.
function resolveChecklistLabels(template: InspectionFormTemplateInfo | null): string[] {
  const items = Array.isArray(template?.checklistItems) ? template.checklistItems : [];
  const labels = items.map((item) => (typeof item === "string" ? item : item?.label ?? ""));
  return labels.length > 0 ? labels : Array.from({ length: BLANK_CHECKLIST_ROWS }, () => "");
}

function CheckBox({ checked }: { checked: boolean }) {
  return <span className={`inline-block h-3 w-3 border border-black align-middle ${checked ? "bg-black" : ""}`} />;
}

// Row 1 = role (Requested/Accepted/Inspected/Issued By), row 2 = company PT.
function SignatureBlock({ company, role }: { company: string; role: string }) {
  return (
    <div className="flex flex-1 flex-col border border-black">
      <p className="border-b border-black px-2 py-1 text-center text-[10px] font-semibold uppercase">{role}</p>
      <p className="px-2 py-1 text-center text-[10px] font-bold leading-tight">{company}</p>
      <div className="h-16" />
      <p className="px-2 py-1 text-[10px]">Name :</p>
    </div>
  );
}

export default function NdeClearancePrintForm({ req }: Props) {
  const navigate = useNavigate();

  // Prefer the frozen snapshot (what the request was created with) so revising
  // the master template later never changes an already-issued form.
  const template = req.formTemplateSnapshot ?? req.formTemplate ?? null;
  const checklistLabels = resolveChecklistLabels(template);
  const checklistValues: InspectionRequestFormChecklistValue[] = Array.isArray(req.formData?.checklist) ? req.formData.checklist : [];

  const title = template?.title || DEFAULT_TITLE;
  const contractor = req.executionCompany?.name || req.executionParty || "-";
  // Contractor PT for the "Requested By" signature block: TankProject →
  // contractorCompany relation; req.contractorCompany is the server-resolved
  // fallback (tank's most recent project) for requests without a project link.
  const contractorCompanyName = req.project?.contractorCompany?.name || req.contractorCompany?.name || "";
  // Same logo resolution as LegacyInspectionRequestPrintForm.
  const inspectionLogo = req.inspectionLogoUrl ?? req.approvedByUser?.company?.logoFile?.url ?? null;
  const dateOfRequest = format(new Date(req.requestDate), "dd MMMM yyyy");
  // Left blank on purpose: filled in by hand when the form is signed.
  const requestedBy = "";
  const tankNo = req.tank?.tankNo || "-";
  const testingType = TEST_TYPE_LABELS[req.testType] ?? req.testType;
  const customerAssetHolder = req.assetHolder || "PT. Pertamina Patra Niaga";
  const standardAndCode = req.standardAndCode || template?.defaultStandardAndCode || "-";
  const inspectionArea = req.requestLocation || req.items?.[0]?.locationDetail || req.items?.[0]?.objectName || "-";

  const infoRows: Array<[string, string, string, string]> = [
    ["Contractor", contractor, "Testing Type", testingType],
    ["Date of Request", dateOfRequest, "Customer / Asset Holder", customerAssetHolder],
    ["Requested By", requestedBy, "Standard & Code", standardAndCode],
    ["Tank No.", tankNo, "Inspection Area / Weld Joint No.", inspectionArea],
  ];

  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 0; }

        @media print {
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .nde-print-wrap { background: white !important; margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
          .nde-print-page { box-shadow: none !important; margin: 0 !important; padding: 10mm !important; width: 297mm !important; }
        }
      `}</style>

      <div className="nde-print-wrap min-h-screen bg-gray-100 py-6">
        <div className="no-print mx-auto mb-4 flex max-w-[297mm] items-center justify-between px-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", req.id))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>

        <div className="nde-print-page mx-auto w-[297mm] bg-white p-8 shadow-lg">
          <div className="border-2 border-black text-black">
            {/* Form heading */}
            <div className="flex items-stretch border-b-2 border-black">
              <div className="w-56 shrink-0 px-2 py-2 flex flex-col items-center justify-center text-center border-r border-black">
                {inspectionLogo ? <img src={inspectionLogo} alt="logo" className="h-16 w-full object-contain" /> : <p className="text-base font-bold text-red-600">PERTAMINA</p>}
              </div>
              <p className="flex-1 self-center px-3 py-2 text-center text-lg font-bold uppercase tracking-wide">{title}</p>
              <div className="flex w-44 shrink-0 flex-col justify-center border-l border-black px-2 py-1 text-[9px]">
                <span>Form No. : {template?.code ?? "-"}</span>
                <span>Rev. : {template?.revision ?? "0"}</span>
                <span>
                  Request No. : <span className="font-semibold">{req.requestNo}</span>
                </span>
              </div>
            </div>

            {/* General information */}
            <div className="border-b-2 border-black">
              {infoRows.map(([leftLabel, leftValue, rightLabel, rightValue], idx) => (
                <div key={leftLabel} className={`grid grid-cols-2 text-[10px] ${idx < infoRows.length - 1 ? "border-b border-black" : ""}`}>
                  <div className="flex border-r-2 border-black">
                    <span className="w-44 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">{leftLabel}</span>
                    <span className="flex-1 px-2 py-1">{leftValue}</span>
                  </div>
                  <div className="flex">
                    <span className="w-56 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">{rightLabel}</span>
                    <span className="flex-1 px-2 py-1">{rightValue}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-200 text-center font-semibold uppercase">
                  <td className="w-10 border-b border-r border-black px-2 py-1">No.</td>
                  <td className="border-b border-r border-black px-2 py-1">Parameter Name</td>
                  <td className="w-16 border-b border-r border-black px-2 py-1">Accept</td>
                  <td className="w-16 border-b border-r border-black px-2 py-1">Reject</td>
                  <td className="w-64 border-b border-black px-2 py-1">Remarks</td>
                </tr>
              </thead>
              <tbody>
                {checklistLabels.map((label, idx) => {
                  const value = checklistValues[idx];
                  return (
                    <tr key={idx}>
                      <td className="border-b border-r border-black px-2 py-1.5 text-center">{idx + 1}</td>
                      <td className="border-b border-r border-black px-2 py-1.5">{label || " "}</td>
                      <td className="border-b border-r border-black px-2 py-1.5 text-center">
                        <CheckBox checked={value?.result === "ACCEPT"} />
                      </td>
                      <td className="border-b border-r border-black px-2 py-1.5 text-center">
                        <CheckBox checked={value?.result === "REJECT"} />
                      </td>
                      <td className="border-b border-black px-2 py-1.5">{value?.remarks ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Note row — left blank for handwritten remarks. Only the generic
                OTHER form keeps the original Acceptance Criteria text. */}
            {req.testType === "OTHER" ? (
              <div className="flex border-b-2 border-black text-[10px]">
                <span className="w-44 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">Acceptance Criteria</span>
                <span className="flex-1 px-2 py-1">{template?.acceptanceCriteriaText || "As per approved procedure / project specification."}</span>
              </div>
            ) : (
              <div className="flex border-b-2 border-black text-[10px]">
                <span className="w-44 shrink-0 border-r border-black px-2 py-1 font-semibold uppercase">Note</span>
                <span className="flex-1 px-2 py-1">&nbsp;</span>
              </div>
            )}

            {/* Signatures */}
            <div className="flex gap-3 p-3">
              <SignatureBlock company={contractorCompanyName || "PT. ________________"} role="Requested By" />
              <SignatureBlock company="PT. Pertamina Patra Niaga (MA4)" role="Accepted By" />
              <SignatureBlock company="PT. Biro Klasifikasi Indonesia" role="Inspected By" />
              <SignatureBlock company="PT. Pertamina Patra Niaga (Stat. Ins. Eng)" role="Issued By" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
