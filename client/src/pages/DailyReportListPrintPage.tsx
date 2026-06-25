// src/pages/DailyReportListPrintPage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { useDailyReports } from "@/features/daily-reports/daily-reports.query";
import { ACTIVITY_LABEL } from "@/features/daily-reports/daily-report.constants";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import type { DailyActivityType } from "@/features/daily-reports/daily-reports.api";

export default function DailyReportListPrintPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const activityType = (searchParams.get("activityType") ?? undefined) as DailyActivityType | undefined;

  const { data, isLoading, isError, refetch } = useDailyReports({
    startDate,
    endDate,
    activityType,
    page: 1,
    limit: 500,
  });

  const reports = data?.items ?? [];

  const firstTank = reports[0]?.tank;
  const companyName = firstTank?.inspectionCompany?.name ?? null;
  const companyLogoUrl = firstTank?.inspectionCompany?.logoFile?.url ?? null;
  console.log("companyLogoUrl", companyLogoUrl);

  const periodLabel = (() => {
    if (startDate && endDate) return `${format(new Date(startDate), "dd MMM yyyy")} – ${format(new Date(endDate), "dd MMM yyyy")}`;
    if (startDate) return `Mulai ${format(new Date(startDate), "dd MMM yyyy")}`;
    if (endDate) return `Sampai ${format(new Date(endDate), "dd MMM yyyy")}`;
    return null;
  })();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load daily reports." onRetry={() => refetch()} />;

  return (
    <>
      <style>{`
        * { font-family: Arial, sans-serif !important; }
        @media print {
          * { font-family: Arial, sans-serif !important; }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root { height: auto !important; overflow: visible !important; }
          #root > div { height: auto !important; overflow: visible !important; }
          aside { display: none !important; }
          header { display: none !important; }
          main { height: auto !important; overflow: visible !important; padding: 0 !important; flex: none !important; }
          .no-print { display: none !important; }
          .print-doc {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-doc * { color: #000000 !important; background: transparent !important; }
          .print-doc table { font-size: 12px !important; background: #ffffff !important; }
          .print-doc th { background: #f3f3f3 !important; color: #000000 !important; font-size: 12px !important; }
          .print-doc tr.row-even { background: #ffffff !important; }
          .print-doc tr.row-odd { background: #f9f9f9 !important; }
          .print-doc th, .print-doc td { padding: 4px 6px !important; border-color: #cccccc !important; }
          .print-doc .border-b, .print-doc .border-t { border-color: #cccccc !important; }
        }
        @page { size: A4 landscape; margin: 15mm; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.DAILY_REPORTS)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} disabled={reports.length === 0}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      {/* Document */}
      <div className="print-doc bg-white border rounded-lg shadow-sm mx-auto max-w-5xl p-10 space-y-6">
        {/* Document Header */}
        <div className="text-center space-y-1 border-b border-gray-300 pb-5">
          {companyLogoUrl && (
            <div className="flex justify-center mb-2">
              <img src={companyLogoUrl} alt={companyName ?? "Company Logo"} className="h-12 object-contain" />
            </div>
          )}
          {companyName && (
            <p style={{ fontSize: "12px", fontWeight: 600 }} className="text-gray-700 uppercase tracking-widest">
              {companyName}
            </p>
          )}
          <h1 style={{ fontSize: "14px", fontWeight: 700 }} className="uppercase tracking-wide text-gray-900 mt-1">
            Laporan Harian Inspeksi
          </h1>
          <p style={{ fontSize: "12px" }} className="text-gray-600">
            Daily Inspection Report
          </p>
          {periodLabel && (
            <p style={{ fontSize: "12px" }} className="text-gray-500 mt-1">
              {periodLabel}
            </p>
          )}
          {activityType && (
            <p style={{ fontSize: "12px" }} className="text-gray-500">
              Jenis Kegiatan: {ACTIVITY_LABEL[activityType] ?? activityType}
            </p>
          )}
        </div>

        {reports.length === 0 ? (
          <EmptyState title="No data to print" description="No daily reports match the selected filter." icon={FileText} />
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ fontSize: "12px" }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-center w-8" style={{ fontSize: "12px", fontWeight: 600 }}>
                      No.
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left w-28" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Tanggal
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left w-24" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Tank
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left w-28" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Jenis Kegiatan
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left" style={{ fontSize: "12px", fontWeight: 600 }}>
                      Uraian Kegiatan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => (
                    <tr key={report.id} className={idx % 2 === 0 ? "row-even bg-white" : "row-odd bg-gray-50"}>
                      <td className="border border-gray-300 px-3 py-2 text-center text-gray-700" style={{ fontSize: "12px" }}>
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 whitespace-nowrap text-gray-900" style={{ fontSize: "12px" }}>
                        {format(new Date(report.reportDate), "dd MMM yyyy")}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900" style={{ fontSize: "12px" }}>
                        {report.tank?.tankNo ?? "—"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-900" style={{ fontSize: "12px" }}>
                        {ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ")}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800" style={{ fontSize: "12px" }}>
                        {report.description ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: report.description }} /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-right text-gray-500" style={{ fontSize: "12px" }}>
              Total: {reports.length} laporan
            </p>

            {/* Signature Section */}
            <div className="pt-6 space-y-4">
              <p className="font-semibold uppercase tracking-wide text-gray-700" style={{ fontSize: "12px" }}>
                Mengetahui / Acknowledged by
              </p>
              <div className="grid grid-cols-2 gap-16">
                <SignatureBox label="Inspektor / Inspector" />
                <SignatureBox label="Pejabat PIC Pertamina" />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-300 pt-4 text-center text-gray-500" style={{ fontSize: "12px" }}>
              <p>Dicetak pada {format(new Date(), "dd MMMM yyyy HH:mm")}</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SignatureBox({ label }: { label: string }) {
  return (
    <div className="space-y-2 text-center">
      <p className="text-gray-600" style={{ fontSize: "12px" }}>
        {label}
      </p>
      <div className="h-20 border-b border-dashed border-gray-300" />
      <p className="text-gray-500" style={{ fontSize: "12px" }}>
        ( ________________________ )
      </p>
    </div>
  );
}
