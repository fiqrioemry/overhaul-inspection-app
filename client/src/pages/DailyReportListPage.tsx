// src/pages/DailyReportListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Pencil, Trash2, Eye, Printer, Plus, ArrowUp, ArrowDown, Download, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DateRangeFilter from "@/components/fields/DateRangeFilter";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import { ACTIVITY_OPTIONS, ACTIVITY_LABEL } from "@/features/daily-reports/daily-report.constants";
import { useDailyReports, useDeleteDailyReport, useDownloadDailyReportAttachments } from "@/features/daily-reports/daily-reports.query";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import type { DailyActivityType, DailyReportSummary } from "@/features/daily-reports/daily-reports.api";

const ACTIVITY_FILTER_OPTIONS = [{ label: "All Types", value: "ALL" }, ...ACTIVITY_OPTIONS];

export default function DailyReportListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<DailyReportSummary | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const deleteMutation = useDeleteDailyReport();
  const downloadMutation = useDownloadDailyReportAttachments();

  // Which row is downloading, so only that row's action is disabled.
  const downloadingId = downloadMutation.isPending ? (downloadMutation.variables ?? null) : null;

  function handleDownloadAttachments(event: React.MouseEvent, reportId: string) {
    // The row itself is not clickable today, but keep the action self-contained so adding
    // row navigation later cannot turn a download into a page change.
    event.stopPropagation();
    if (downloadingId) return; // one archive at a time; blocks a double-click re-request
    downloadMutation.mutate(reportId);
  }

  const { data, isLoading, isError, refetch } = useDailyReports({
    page,
    limit: 20,
    orderBy: "reportDate",
    sortBy: dateSort,
    ...(activityType !== "ALL" && { activityType: activityType as DailyActivityType }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  function toggleDateSort() {
    setDateSort((prev) => (prev === "desc" ? "asc" : "desc"));
    setPage(1);
  }

  function handlePrintList() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (activityType !== "ALL") params.set("activityType", activityType);
    navigate(`${ROUTES.DAILY_REPORT_LIST_PRINT}?${params.toString()}`);
  }

  function resetFilters() {
    setSearch("");
    setActivityType("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  const hasActiveFilter = Boolean(search) || activityType !== "ALL" || Boolean(startDate) || Boolean(endDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reports"
        description="Inspector daily activity records — tank, process, or general activity"
        action={
          <PermissionGate permission={PERMISSIONS.DAILY_REPORT_CREATE}>
            <Button onClick={() => navigate(ROUTES.DAILY_REPORT_CREATE)}>
              <Plus className="h-4 w-4 mr-1" /> Create Report
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by tank, title, or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
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

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setPage(1);
          }}
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
                    <th className="px-4 py-3 text-left font-medium">
                      <button type="button" onClick={toggleDateSort} className="flex items-center gap-1 hover:text-foreground" title={`Sort by date (${dateSort === "asc" ? "ascending" : "descending"})`}>
                        Date
                        {dateSort === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Tank</th>
                    <th className="px-4 py-3 text-left font-medium">Activity Type</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
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
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{ACTIVITY_LABEL[report.activityType] ?? report.activityType.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-2 text-xs font-medium">{report.title || "—"}</p>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="line-clamp-2 text-xs">
                          {report.description
                            ? report.description
                                .replace(/<[^>]+>/g, " ")
                                .replace(/\s+/g, " ")
                                .trim()
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{report.inspector?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", report.id))} title="View Detail">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {/* Only rendered when the report actually has attachments — no disabled placeholder. */}
                          {report.hasAttachments && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => handleDownloadAttachments(e, report.id)}
                              disabled={downloadingId === report.id}
                              title={`Download Attachments (${report.attachmentCount})`}
                              aria-label={`Download ${report.attachmentCount} attachment${report.attachmentCount === 1 ? "" : "s"} as ZIP`}
                              aria-busy={downloadingId === report.id}
                            >
                              {downloadingId === report.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <Download className="h-3.5 w-3.5 text-muted-foreground" />}
                            </Button>
                          )}
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
    </div>
  );
}
