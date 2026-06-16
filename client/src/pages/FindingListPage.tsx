// src/pages/FindingListPage.tsx
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import { FindingStatusBadge, FindingSeverityBadge } from "@/features/findings/components/FindingStatusBadge";
import { useFindings } from "@/features/findings/findings.query";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import type { FindingStatus } from "@/features/findings/findings.api";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Status", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Repair", value: "IN_REPAIR" },
  { label: "Repaired", value: "REPAIRED" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Closed", value: "CLOSED" },
];

export default function FindingListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const debouncedSearch = useDebounce(search, 400);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Findings" description="All inspection findings across tanks and processes" />

      <div className="flex items-center gap-3">
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
                    <th className="px-4 py-3 text-left font-medium">Finding No.</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Tank</th>
                    <th className="px-4 py-3 text-left font-medium">Process</th>
                    <th className="px-4 py-3 text-left font-medium">Severity</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Created By</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((finding) => (
                    <tr key={finding.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{finding.findingNo}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="line-clamp-2">{finding.title}</span>
                        {finding.locationDetail && (
                          <span className="block text-xs text-muted-foreground">{finding.locationDetail}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{finding.tank.tankNo}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{finding.tankProcess.name}</td>
                      <td className="px-4 py-3">
                        <FindingSeverityBadge severity={finding.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <FindingStatusBadge status={finding.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{finding.createdByUser.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(finding.createdAt), "dd MMM yyyy")}
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
    </div>
  );
}
