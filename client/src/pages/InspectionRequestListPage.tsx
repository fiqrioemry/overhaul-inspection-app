// src/pages/InspectionRequestListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";
import { useInspectionRequests } from "@/features/inspection-requests/inspection-requests.query";
import { ROUTES } from "@/constants/route.constant";
import type { InspectionRequestStatus } from "@/features/inspection-requests/inspection-requests.api";
import { format } from "date-fns";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Reviewed", value: "REVIEWED" },
  { label: "Returned", value: "RETURNED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function InspectionRequestListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data, isLoading, isError, refetch } = useInspectionRequests({
    page,
    limit: 15,
    status: statusFilter !== "ALL" ? (statusFilter as InspectionRequestStatus) : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspection Requests"
        description="Review and manage inspection/test review requests"
      />

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load inspection requests." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No inspection requests" description="No requests match the current filter." icon={ClipboardList} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Request No.</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Tank</th>
                    <th className="px-4 py-3 text-left font-medium">Process</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Submitted By</th>
                    <th className="px-4 py-3 text-left font-medium">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((req) => {
                    const detailPath = ROUTES.INSPECTION_REQUEST_DETAIL.replace(":requestId", req.id);
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-muted/20 cursor-pointer"
                        onClick={() => navigate(detailPath)}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{req.requestNo}</td>
                        <td className="px-4 py-3 font-medium max-w-[240px] truncate">{req.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{req.tankProcess.tank.tankNo}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{req.tankProcess.processTemplate.name}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{req.submittedBy?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {req.submittedAt ? format(new Date(req.submittedAt), "dd MMM yyyy HH:mm") : "—"}
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
    </div>
  );
}
