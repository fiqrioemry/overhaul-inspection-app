// src/pages/DailyReportListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Pencil, Trash2, Eye, Printer, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import DailyReportFormDialog, { ACTIVITY_OPTIONS, ACTIVITY_LABEL } from "@/features/daily-reports/components/DailyReportFormDialog";
import { useDailyReports, useDeleteDailyReport } from "@/features/daily-reports/daily-reports.query";
import { format } from "date-fns";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import type { DailyActivityType, DailyReportSummary } from "@/features/daily-reports/daily-reports.api";

const ACTIVITY_FILTER_OPTIONS = [{ label: "All Types", value: "ALL" }, ...ACTIVITY_OPTIONS];

export default function DailyReportListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [activityType, setActivityType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<DailyReportSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const deleteMutation = useDeleteDailyReport();

  const { data, isLoading, isError, refetch } = useDailyReports({
    page,
    limit: 20,
    ...(activityType !== "ALL" && { activityType: activityType as DailyActivityType }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  function handlePrintList() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (activityType !== "ALL") params.set("activityType", activityType);
    navigate(`${ROUTES.DAILY_REPORT_LIST_PRINT}?${params.toString()}`);
  }

  function resetFilters() {
    setActivityType("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  const hasActiveFilter = activityType !== "ALL" || startDate || endDate;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reports"
        description="Inspector daily activity records — tank, process, or general activity"
        action={
          <PermissionGate permission={PERMISSIONS.DAILY_REPORT_CREATE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Report
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
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

        <Input
          type="date"
          className="w-38 text-sm"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          title="Start date"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="date"
          className="w-38 text-sm"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          title="End date"
        />

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
            Reset
          </Button>
        )}

        <Button variant="outline" size="sm" className="ml-auto" onClick={handlePrintList}>
          <Printer className="h-4 w-4 mr-1" /> Print List
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load daily reports." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No daily reports" description="Add a daily report from a process detail page." icon={FileText} />
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
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(report.reportDate), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{report.tank?.tankNo ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{report.tankProcess?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="line-clamp-2 text-xs">{report.description ? report.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{report.inspector?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", report.id))}
                            title="View Detail"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <PermissionGate permission={PERMISSIONS.DAILY_REPORT_UPDATE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => navigate(ROUTES.DAILY_REPORT_EDIT.replace(":id", report.id))} title="Edit">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(report)} title="Delete" disabled={deleteMutation.isPending}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Daily Report"
        description={`Delete the report dated "${deleteTarget ? format(new Date(deleteTarget.reportDate), "dd MMM yyyy") : ""}" (${deleteTarget ? ACTIVITY_LABEL[deleteTarget.activityType] : ""})? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />

      <DailyReportFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
