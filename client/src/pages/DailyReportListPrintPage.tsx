// src/pages/DailyReportListPrintPage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { useDailyReports } from "@/features/daily-reports/daily-reports.query";
import { ACTIVITY_LABEL } from "@/features/daily-reports/components/DailyReportFormDialog";
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

  // Derive company name from the first report's inspection company
  const companyName = reports[0]?.tank.inspectionCompany?.name ?? null;

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
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          #root { height: auto !important; overflow: visible !important; }
          #root > div { height: auto !important; overflow: visible !important; }
          aside { display: none !important; }
          header { display: none !important; }
          main { height: auto !important; overflow: visible !important; padding: 0 !important; flex: none !important; }
          .no-print { display: none !important; }
          .print-doc { box-shadow: none !important; border: none !important; border-radius: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          table { font-size: 9pt !important; }
          th, td { padding: 4px 6px !important; }
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
        <div className="text-center space-y-1 border-b pb-5">
          {companyName && (
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">{companyName}</p>
          )}
          <h1 className="text-lg font-bold uppercase tracking-wide">Laporan Harian Bulanan</h1>
          <p className="text-sm font-medium text-gray-600">Monthly Daily Activity</p>
          {periodLabel && <p className="text-xs text-gray-500 mt-1">{periodLabel}</p>}
          {activityType && (
            <p className="text-xs text-gray-400">Jenis Kegiatan: {ACTIVITY_LABEL[activityType] ?? activityType}</p>
          )}
        </div>

        {reports.length === 0 ? (
          <EmptyState
            title="No data to print"
            description="No daily reports match the selected filter."
            icon={FileText}
          />
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-8">No.</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-28">Tanggal</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-24">Tank</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-28">Jenis Kegiatan</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Uraian Kegiatan</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => (
                    <tr key={report.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-3 py-2 text-center text-gray-500">{idx + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">
                        {format(new Date(report.reportDate), "dd MMM yyyy")}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-mono font-medium">
                        {report.tank.tankNo}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ")}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-700">
                        <p className="whitespace-pre-wrap">{report.description ?? "—"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 text-right">Total: {reports.length} laporan</p>

            {/* Signature Section */}
            <div className="pt-6 space-y-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mengetahui / Acknowledged by</p>
              <div className="grid grid-cols-2 gap-16">
                <SignatureBox label="Inspektor / Inspector" />
                <SignatureBox label="Pejabat PIC Pertamina" />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 text-center text-[11px] text-gray-400">
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
      <p className="text-xs text-gray-500">{label}</p>
      <div className="h-20 border-b border-dashed border-gray-300" />
      <p className="text-xs text-gray-400">( ________________________ )</p>
    </div>
  );
}
