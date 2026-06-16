// src/pages/FindingListPage.tsx
import { useState } from "react";
import { AlertTriangle, Pencil, ArrowRightLeft, Trash2, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import { FindingStatusBadge, FindingSeverityBadge } from "@/features/findings/components/FindingStatusBadge";
import FindingEditDialog from "@/features/findings/components/FindingEditDialog";
import FindingStatusDialog from "@/features/findings/components/FindingStatusDialog";
import { useFindings, useDeleteFinding, useBulkCloseFindings } from "@/features/findings/findings.query";
import { useDebounce } from "@/hooks/useDebounce";
import { PERMISSIONS } from "@/constants/permission.constant";
import { format } from "date-fns";
import type { FindingStatus, FindingSummary } from "@/features/findings/findings.api";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Status", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Repair", value: "IN_REPAIR" },
  { label: "Closed", value: "CLOSE" },
];

export default function FindingListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editFinding, setEditFinding] = useState<FindingSummary | null>(null);
  const [statusFinding, setStatusFinding] = useState<FindingSummary | null>(null);
  const [quickCloseFinding, setQuickCloseFinding] = useState<FindingSummary | null>(null);
  const [bulkCloseOpen, setBulkCloseOpen] = useState(false);
  const [deleteFindingTarget, setDeleteFindingTarget] = useState<FindingSummary | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const deleteMutation = useDeleteFinding();
  const bulkClose = useBulkCloseFindings();

  const { data, isLoading, isError, refetch } = useFindings({
    page,
    limit: 15,
    ...(status !== "ALL" && { status: status as FindingStatus }),
  });

  const filtered = debouncedSearch
    ? (data?.items ?? []).filter(
        (f) =>
          f.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          f.findingNo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          f.tank.tankNo.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : (data?.items ?? []);

  const closeableIds = filtered.filter((f) => f.status !== "CLOSE").map((f) => f.id);
  const allCloseableSelected = closeableIds.length > 0 && closeableIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allCloseableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(closeableIds));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkCloseConfirm() {
    bulkClose.mutate(
      { ids: [...selectedIds] },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkCloseOpen(false);
        },
      },
    );
  }

  function handleQuickCloseConfirm() {
    if (!quickCloseFinding) return;
    bulkClose.mutate(
      { ids: [quickCloseFinding.id] },
      { onSuccess: () => setQuickCloseFinding(null) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Findings" description="All inspection findings across tanks and processes" />

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search findings..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {someSelected && (
          <PermissionGate permission={PERMISSIONS.FINDING_UPDATE}>
            <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => setBulkCloseOpen(true)}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Close Selected ({selectedIds.size})
            </Button>
          </PermissionGate>
        )}
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load findings." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {filtered.length === 0 ? (
            <EmptyState title="No findings" description="No findings match the current filter." icon={AlertTriangle} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={allCloseableSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        disabled={closeableIds.length === 0}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Finding No.</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Tank</th>
                    <th className="px-4 py-3 text-left font-medium">Process</th>
                    <th className="px-4 py-3 text-left font-medium">Severity</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Created By</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((finding) => {
                    const isTerminal = finding.status === "CLOSE";
                    const isSelected = selectedIds.has(finding.id);
                    return (
                      <tr key={finding.id} className={`hover:bg-muted/20 ${isSelected ? "bg-muted/30" : ""}`}>
                        <td className="px-4 py-3">
                          {!isTerminal && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(finding.id)}
                              aria-label={`Select ${finding.findingNo}`}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{finding.findingNo}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="line-clamp-2">{finding.title}</span>
                          {finding.locationDetail && <span className="block text-xs text-muted-foreground">{finding.locationDetail}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{finding.tank.tankNo}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{finding.tankProcess.name}</td>
                        <td className="px-4 py-3">
                          <FindingSeverityBadge severity={finding.severity} />
                        </td>
                        <td className="px-4 py-3">
                          <FindingStatusBadge status={finding.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{finding.createdByUser?.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(finding.createdAt), "dd MMM yyyy")}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <PermissionGate permission={PERMISSIONS.FINDING_UPDATE}>
                              {!isTerminal && (
                                <>
                                  <Button variant="ghost" size="icon-sm" onClick={() => setEditFinding(finding)} title="Edit">
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button variant="ghost" size="icon-sm" onClick={() => setQuickCloseFinding(finding)} title="Quick close" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="icon-sm" onClick={() => setStatusFinding(finding)} title="Update status">
                                <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              {isTerminal && (
                                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteFindingTarget(finding)} title="Delete" disabled={deleteMutation.isPending}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              )}
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}

      {editFinding && <FindingEditDialog open={Boolean(editFinding)} onOpenChange={(open) => !open && setEditFinding(null)} finding={editFinding} />}

      {statusFinding && <FindingStatusDialog open={Boolean(statusFinding)} onOpenChange={(open) => !open && setStatusFinding(null)} finding={statusFinding} />}

      <ConfirmDialog
        open={Boolean(quickCloseFinding)}
        onOpenChange={(open) => !open && setQuickCloseFinding(null)}
        title="Close Finding"
        description={`Close finding "${quickCloseFinding?.findingNo} — ${quickCloseFinding?.title}"? This marks it as resolved.`}
        confirmLabel="Close Finding"
        loading={bulkClose.isPending}
        onConfirm={handleQuickCloseConfirm}
      />

      <ConfirmDialog
        open={bulkCloseOpen}
        onOpenChange={setBulkCloseOpen}
        title="Close Selected Findings"
        description={`Close ${selectedIds.size} selected finding(s)? Already closed or rejected ones will be skipped.`}
        confirmLabel={`Close ${selectedIds.size} Finding(s)`}
        loading={bulkClose.isPending}
        onConfirm={handleBulkCloseConfirm}
      />

      <ConfirmDialog
        open={Boolean(deleteFindingTarget)}
        onOpenChange={(open) => !open && setDeleteFindingTarget(null)}
        title="Delete Finding"
        description={`Are you sure you want to delete finding "${deleteFindingTarget?.findingNo}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteFindingTarget) return;
          deleteMutation.mutate(deleteFindingTarget.id, { onSuccess: () => setDeleteFindingTarget(null) });
        }}
      />
    </div>
  );
}
