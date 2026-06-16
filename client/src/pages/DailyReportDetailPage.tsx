// src/pages/DailyReportDetailPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { useDailyReport } from "@/features/daily-reports/daily-reports.query";
import { ACTIVITY_LABEL } from "@/features/daily-reports/components/DailyReportFormDialog";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

export default function DailyReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError, refetch } = useDailyReport(id!);

  useEffect(() => {
    if (report) {
      document.title = `Daily Report — ${report.tank.tankNo} — ${format(new Date(report.reportDate), "dd MMM yyyy")}`;
    }
    return () => {
      document.title = "Pantau Inspeksi";
    };
  }, [report]);

  if (isLoading) return <LoadingState />;
  if (isError || !report) return <ErrorState message="Failed to load daily report." onRetry={() => refetch()} />;

  const reportDateFormatted = format(new Date(report.reportDate), "dd MMMM yyyy");
  const activityLabel = ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ");
  const hasPhotos = report.attachments.length > 0;
  const companyName = report.tank.inspectionCompany?.name ?? null;

  return (
    <>
      <style>{`
        @media print {
          /* Fix AppLayout overflow constraints */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          #root {
            height: auto !important;
            overflow: visible !important;
          }
          #root > div {
            height: auto !important;
            overflow: visible !important;
          }
          aside { display: none !important; }
          header { display: none !important; }
          main {
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            flex: none !important;
          }

          /* Report layout */
          .no-print { display: none !important; }
          .report-viewer {
            background: none !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .report-page {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .photo-page {
            break-before: page !important;
          }
          img { break-inside: avoid; }
          .attachment-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }

        @page {
          size: A4 portrait;
          margin: 20mm;
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.DAILY_REPORTS)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>

      {/* Canva-like page viewer */}
      <div className="report-viewer bg-gray-300 rounded-lg p-8 flex flex-col items-center gap-6">
        {/* ── PAGE 1: content without photos ── */}
        <div className="report-page bg-white shadow-lg w-full max-w-198 min-h-[1123px] p-16 flex flex-col gap-8">
          {/* Document Header */}
          <div className="text-center border-b pb-6 space-y-1">
            {companyName && (
              <p className="text-[11px] text-gray-500 uppercase tracking-widest">{companyName}</p>
            )}
            <h1 className="text-lg font-bold uppercase tracking-wide">Laporan Harian Inspeksi</h1>
            <p className="text-[11px] text-gray-500">Daily Inspection Report</p>
          </div>

          {/* Metadata Table */}
          <div>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <MetaRow label="Tanggal / Date" value={reportDateFormatted} />
                <MetaRow label="Nomor Tangki / Tank No." value={report.tank.tankNo} />
                {report.tank.tankName && <MetaRow label="Nama Tangki / Tank Name" value={report.tank.tankName} />}
                <MetaRow label="Proses / Process" value={report.tankProcess?.name ?? "—"} />
                <MetaRow label="Jenis Kegiatan / Activity Type" value={activityLabel} />
                <MetaRow label="Inspektor / Inspector" value={report.inspector?.name ?? "—"} />
              </tbody>
            </table>
          </div>

          {/* Description */}
          <div className="space-y-3 flex-1">
            <SectionTitle>Uraian Kegiatan / Activity Description</SectionTitle>
            <div className="border rounded p-4 min-h-48 text-sm leading-relaxed whitespace-pre-wrap">{report.description || <span className="text-gray-400 italic">Tidak ada deskripsi.</span>}</div>
          </div>

          {/* Signature Section */}
          <div className="space-y-4 mt-auto">
            <SectionTitle>Tanda Tangan / Signatures</SectionTitle>
            <div className="grid grid-cols-2 gap-12">
              <SignatureBox label="Inspektor / Inspector" name={report.inspector?.name} />
              <SignatureBox label="Pejabat PIC / Pertamina PIC" name={undefined} />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-[11px] text-gray-400">
            <p>Dicetak pada {format(new Date(), "dd MMMM yyyy HH:mm")}</p>
            {hasPhotos && <p className="mt-0.5 text-gray-300">Halaman 1 dari 2 — Dokumentasi foto terdapat di halaman berikutnya</p>}
          </div>
        </div>

        {/* ── PAGE 2: photos only ── */}
        {hasPhotos && (
          <div className="photo-page report-page bg-white shadow-lg w-full max-w-[794px] min-h-[1123px] p-16 flex flex-col gap-8">
            {/* Page 2 header */}
            <div className="text-center border-b pb-4 space-y-0.5">
              {companyName && (
                <p className="text-[11px] text-gray-500 uppercase tracking-widest">{companyName}</p>
              )}
              <h2 className="text-base font-semibold uppercase tracking-wide">Dokumentasi Foto</h2>
              <p className="text-[11px] text-gray-500">
                {report.tank.tankNo} &mdash; {reportDateFormatted}
              </p>
            </div>

            {/* Photo grid */}
            <div className="attachment-grid grid grid-cols-2 sm:grid-cols-3 gap-6">
              {report.attachments.map((att, idx) => (
                <div key={att.id} className="space-y-1.5">
                  <div className="border rounded overflow-hidden aspect-4/3 bg-gray-100">
                    <img src={att.attachmentUrl} alt={att.caption ?? `Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                  {att.caption ? <p className="text-[11px] text-center text-gray-500 leading-snug">{att.caption}</p> : <p className="text-[11px] text-center text-gray-300 italic">Foto {idx + 1}</p>}
                </div>
              ))}
            </div>

            {/* Footer page 2 */}
            <div className="border-t pt-4 mt-auto text-center text-[11px] text-gray-400">
              <p>Halaman 2 dari 2</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2.5 pr-4 text-gray-500 font-medium w-56 align-top text-sm">{label}</td>
      <td className="py-2.5 font-semibold text-sm">{value}</td>
    </tr>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 border-b pb-1.5">{children}</h2>;
}

function SignatureBox({ label, name }: { label: string; name: string | undefined }) {
  return (
    <div className="space-y-2 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="h-24 border-b border-dashed border-gray-300" />
      <p className="text-sm font-medium">{name ?? "( ________________________ )"}</p>
    </div>
  );
}
