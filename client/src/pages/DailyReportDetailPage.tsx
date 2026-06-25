// src/pages/DailyReportDetailPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { useDailyReport } from "@/features/daily-reports/daily-reports.query";
import { ACTIVITY_LABEL } from "@/features/daily-reports/daily-report.constants";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

const LOCATION_LABEL: Record<string, string> = {
  SUNGAI_GERONG: "Sungai Gerong",
  PLADJU: "Pladju",
};

const PHOTOS_PER_PAGE = 6;

export default function DailyReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError, refetch } = useDailyReport(id!);

  useEffect(() => {
    if (report) {
      document.title = `Laporan Harian — ${report.tank?.tankNo ?? "Umum"} — ${format(new Date(report.reportDate), "dd MMM yyyy")}`;
    }
    return () => {
      document.title = "Pantau Inspeksi";
    };
  }, [report]);

  if (isLoading) return <LoadingState />;
  if (isError || !report) return <ErrorState message="Failed to load daily report." onRetry={() => refetch()} />;

  const reportDateFormatted = format(new Date(report.reportDate), "dd MMMM yyyy");
  const activityLabel = ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ");
  const locationLabel = report.tank?.location ? (LOCATION_LABEL[report.tank.location] ?? report.tank.location) : null;

  const inspectionCompany = report.project?.inspectionCompany ?? null;
  const inspectionLogoUrl = inspectionCompany?.logoFile?.url ?? null;

  const attachments = report.attachments;
  const photoPages: (typeof attachments)[] = [];
  for (let i = 0; i < attachments.length; i += PHOTOS_PER_PAGE) {
    photoPages.push(attachments.slice(i, i + PHOTOS_PER_PAGE));
  }

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
          #root, #root > div {
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
            padding: 15mm 20mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .report-page * { color: #000000 !important; }
          .report-page table td { color: #000000 !important; }
          .photo-page { break-before: page !important; }
          img { break-inside: avoid; }
        }

        /* Suppress browser print headers (URL, date, title, page number) */
        @page {
          size: A4 portrait;
          margin: 0;
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

      <div className="report-viewer bg-gray-300 rounded-lg p-8 flex flex-col items-center gap-6">
        {/* ── PAGE 1: report content ── */}
        <div className="report-page bg-white shadow-lg w-full max-w-198.5 min-h-280.75 p-16 flex flex-col gap-8">
          {/* Header — logos left/right, title centered */}
          <div className="border-b-2 border-black pb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Inspection company logo */}
              <CompanyLogo url={inspectionLogoUrl} name={inspectionCompany?.name} size="md" />

              {/* Center: title */}
              <div className="flex-1 text-center space-y-0.5">
                <h1 style={{ fontSize: "14px", fontWeight: 700 }} className="uppercase tracking-wide text-gray-900">
                  Laporan Harian Inspeksi
                </h1>
                <p style={{ fontSize: "12px" }} className="text-gray-500">
                  Daily Inspection Report
                </p>
                {inspectionCompany && (
                  <p style={{ fontSize: "12px" }} className="text-gray-400 uppercase tracking-widest mt-1">
                    {inspectionCompany.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata table */}
          <div>
            <table className="w-full border-collapse" style={{ fontSize: "12px" }}>
              <tbody>
                <MetaRow label="Tanggal / Date" value={reportDateFormatted} />
                <MetaRow label="Nomor Tangki / Tank No." value={report.tank?.tankNo ?? "—"} />
                {locationLabel && <MetaRow label="Lokasi / Location" value={locationLabel} />}
                <MetaRow label="Proses / Process" value={report.tankProcess?.name ?? "—"} />
                <MetaRow label="Jenis Kegiatan / Activity Type" value={activityLabel} />
              </tbody>
            </table>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <SectionTitle>Uraian Kegiatan / Activity Description</SectionTitle>
            {report.description ? (
              <div className="leading-relaxed pt-2 prose prose-sm max-w-none" style={{ fontSize: "12px" }} dangerouslySetInnerHTML={{ __html: report.description }} />
            ) : (
              <div className="pt-2" style={{ fontSize: "12px" }}>
                <span className="text-gray-400 italic">Tidak ada deskripsi.</span>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="space-y-3 flex-1">
            <SectionTitle>Rekomendasi / Recommendation</SectionTitle>
            {report.recommendation ? (
              <div className="leading-relaxed pt-2 prose prose-sm max-w-none" style={{ fontSize: "12px" }} dangerouslySetInnerHTML={{ __html: report.recommendation }} />
            ) : (
              <div className="pt-2" style={{ fontSize: "12px" }}>
                <span className="text-gray-400 italic">Belum ada rekomendasi.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── PHOTO PAGES: 6 photos per page, 2 columns ── */}
        {photoPages.map((pagePhotos, pageIdx) => (
          <div key={pageIdx} className="photo-page report-page bg-white shadow-lg w-full max-w-198.5 min-h-280.75 p-16 flex flex-col gap-6">
            {/* Page header */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between gap-4">
                <CompanyLogo url={inspectionLogoUrl} name={inspectionCompany?.name} size="md" />
                <div className="flex-1 text-center space-y-0.5">
                  <h2 style={{ fontSize: "12px", fontWeight: 700 }} className="uppercase tracking-wide text-gray-900">
                    Dokumentasi Foto
                  </h2>
                  <p style={{ fontSize: "12px" }} className="text-gray-500">
                    {report.tank?.tankNo ?? "Kegiatan Umum"} &mdash; {reportDateFormatted}
                  </p>
                </div>
              </div>
            </div>

            {/* 2-column grid, max 6 photos */}
            <div className="grid grid-cols-2 gap-6 flex-1">
              {pagePhotos.map((att, idx) => {
                const globalIdx = pageIdx * PHOTOS_PER_PAGE + idx + 1;
                return (
                  <div key={att.id} className="space-y-1">
                    <div className="border rounded overflow-hidden aspect-4/3 bg-gray-100">
                      <img src={att.attachmentUrl} alt={att.caption ?? `Foto ${globalIdx}`} className="w-full h-full object-cover" />
                    </div>
                    <p style={{ fontSize: "8px" }} className="text-center text-gray-500 leading-snug">
                      {att.caption ? att.caption : <span className="italic text-gray-300">Foto {globalIdx}</span>}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t pt-3 text-center text-gray-400" style={{ fontSize: "12px" }}>
              <p>Dicetak pada {format(new Date(), "dd MMMM yyyy HH:mm")}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CompanyLogo({ url, name, size = "md" }: { url: string | null; name: string | undefined; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-10 w-10" : "h-14 w-14";
  return <div className={`${dim} shrink-0 flex items-center justify-center`}>{url ? <img src={url} alt={name ?? "logo"} className="h-full w-full object-contain" /> : <Building2 className="size-6 text-gray-300" />}</div>;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-4 text-gray-500 w-56 align-top" style={{ fontSize: "12px", fontWeight: 600 }}>
        {label}
      </td>
      <td className="py-2 text-gray-900" style={{ fontSize: "12px", fontWeight: 600 }}>
        {value}
      </td>
    </tr>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="uppercase tracking-widest text-gray-600 border-b pb-1.5" style={{ fontSize: "12px", fontWeight: 700 }}>
      {children}
    </h2>
  );
}
