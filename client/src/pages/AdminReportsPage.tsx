/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useAdminReports, useUpdateReport } from "@/features/admin/admin.query";
import type { AdminReportItem, GetReportsParams, ReportStatus, UpdateReportPayload } from "@/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  REVIEWED: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  DISMISSED: "bg-zinc-100 text-zinc-600",
};

const ACTION_STATUSES: Array<UpdateReportPayload["status"]> = ["REVIEWED", "RESOLVED", "DISMISSED"];

export default function AdminReportsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminReportItem | null>(null);
  const [actionStatus, setActionStatus] = useState<UpdateReportPayload["status"]>("REVIEWED");
  const [actionNote, setActionNote] = useState("");

  const params: GetReportsParams = {
    page,
    limit: 20,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  };

  const { data, isLoading } = useAdminReports(params);
  const { mutate: updateReport, isPending } = useUpdateReport();

  const reports = data?.data ?? [];
  const totalPages = data?.meta?.pagination?.totalPages ?? 1;

  function openDialog(report: AdminReportItem) {
    setSelected(report);
    setActionStatus("REVIEWED");
    setActionNote("");
  }

  function handleSubmit() {
    if (!selected) return;
    const payload: UpdateReportPayload = {
      status: actionStatus,
      actionTaken: actionNote.trim() || undefined,
    };
    updateReport({ reportId: selected.id, payload }, { onSuccess: () => setSelected(null) });
  }

  return (
    <>
      <Helmet>
        <title>{t("admin:reportsTitle")} — Admin</title>
      </Helmet>

      <div className="flex flex-1 flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("admin:reportsTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin:reportsSubtitle")}</p>
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ReportStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("admin:filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("admin:filterAll")}</SelectItem>
              <SelectItem value="PENDING">{t("admin:reportStatusPending")}</SelectItem>
              <SelectItem value="REVIEWED">{t("admin:reportStatusReviewed")}</SelectItem>
              <SelectItem value="RESOLVED">{t("admin:reportStatusResolved")}</SelectItem>
              <SelectItem value="DISMISSED">{t("admin:reportStatusDismissed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colReporter")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colPost")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colReason")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colStatus")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colDate")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("admin:colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-5 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : reports.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="font-medium">@{r.reporter.username}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="max-w-32 truncate text-muted-foreground">{r.post.title || r.post.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {r.reason}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status as ReportStatus]}`}>
                          {t(`admin:reportStatus${r.status.charAt(0) + r.status.slice(1).toLowerCase()}` as any)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={r.status !== "PENDING"} onClick={() => openDialog(r)}>
                          {t("admin:actionReview")}
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("admin:pageOf", { current: page, total: totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin:reviewReportTitle")}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Report details */}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">{t("admin:colReporter")}:</span> @{selected.reporter.username}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("admin:colReason")}:</span> {selected.reason}
                </p>
                {selected.description && (
                  <p>
                    <span className="text-muted-foreground">{t("admin:colDescription")}:</span> {selected.description}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="space-y-2">
                <Label>{t("admin:reviewAction")}</Label>
                <Select value={actionStatus} onValueChange={(v) => setActionStatus(v as UpdateReportPayload["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`admin:reportStatus${s.charAt(0) + s.slice(1).toLowerCase()}` as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>{t("admin:reviewNote")}</Label>
                <Textarea placeholder={t("admin:reviewNotePlaceholder")} value={actionNote} onChange={(e) => setActionNote(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t("common:cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {t("common:confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
