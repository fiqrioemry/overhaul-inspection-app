// src/pages/DailyReportListPage.tsx
import { useState } from "react";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import { useDailyReports } from "@/features/daily-reports/daily-reports.query";
import { format } from "date-fns";
import type { DailyActivityType } from "@/features/daily-reports/daily-reports.api";

const ACTIVITY_FILTER_OPTIONS = [
  { label: "All Types", value: "ALL" },
  { label: "General", value: "GENERAL" },
  { label: "Fabrication", value: "FABRICATION" },
  { label: "Inspection", value: "INSPECTION" },
  { label: "Testing", value: "TESTING" },
  { label: "Coating", value: "COATING" },
  { label: "Commissioning", value: "COMMISSIONING" },
  { label: "Repair", value: "REPAIR" },
  { label: "Other", value: "OTHER" },
];

export default function DailyReportListPage() {
  const [page, setPage] = useState(1);
  const [activityType, setActivityType] = useState<string>("ALL");

  const { data, isLoading, isError, refetch } = useDailyReports({
    page,
    limit: 20,
    ...(activityType !== "ALL" && { activityType: activityType as DailyActivityType }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reports"
        description="Inspector daily activity records — create from Process Detail page"
      />

      <div className="flex items-center gap-3">
        <Select
          value={activityType}
          onValueChange={(v) => {
            setActivityType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load daily reports." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No daily reports" description="Add a daily report to start tracking activities." icon={FileText} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Tank</th>
                    <th className="px-4 py-3 text-left font-medium">Process</th>
                    <th className="px-4 py-3 text-left font-medium">Activity Type</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(report.reportDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{report.tank.tankNo}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{report.tankProcess?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{report.activityType.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="line-clamp-2 text-xs">{report.description}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{report.inspector?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
