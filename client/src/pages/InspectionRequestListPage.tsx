// src/pages/InspectionRequestListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Eye, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PermissionGate from "@/components/common/PermissionGate";
import RequestStatusBadge from "@/features/inspection-requests/components/RequestStatusBadge";
import { useInspectionRequests, useDeleteInspectionRequest } from "@/features/inspection-requests/inspection-requests.query";
import { TEST_TYPE_LABELS, TEST_TYPE_OPTIONS, STATUS_LABELS } from "@/features/inspection-requests/inspection-request.constants";
import { format } from "date-fns";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import type { InspectionRequestListRow, InspectionRequestStatus, InspectionRequestType } from "@/features/inspection-requests/inspection-requests.api";

const STATUS_FILTER = [{ label: "All Status", value: "ALL" }, ...(Object.keys(STATUS_LABELS) as InspectionRequestStatus[]).map((v) => ({ label: STATUS_LABELS[v], value: v }))];
const TYPE_FILTER = [{ label: "All Types", value: "ALL" }, ...TEST_TYPE_OPTIONS];

export default function InspectionRequestListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("ALL");
  const [testType, setTestType] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<InspectionRequestListRow | null>(null);

  const deleteMutation = useDeleteInspectionRequest();

  const { data, isLoading, isError, refetch } = useInspectionRequests({
    page,
    limit: 10,
    ...(status !== "ALL" && { status: status as InspectionRequestStatus }),
    ...(testType !== "ALL" && { testType: testType as InspectionRequestType }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspection Requests"
        description="Digital inspection/test request forms"
        action={
          <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_CREATE}>
            <Button onClick={() => navigate(ROUTES.INSPECTION_REQUEST_CREATE)}>
              <Plus className="h-4 w-4 mr-1" /> Create Request
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={testType}
          onValueChange={(v) => {
            setTestType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load inspection requests." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No inspection requests" description="Create a request to generate a printable inspection/test form." icon={ClipboardList} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Request No.</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Tank / Process</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Progress</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", r.id))}>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{r.requestNo}</td>
                      <td className="px-4 py-3 text-xs">{TEST_TYPE_LABELS[r.testType] ?? r.testType}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.tank?.tankNo ?? "—"}
                        {r.tankProcess ? ` · ${r.tankProcess.name}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(r.requestDate), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.summary.totalPassed}/{r.summary.totalObjects} ({r.summary.progressPercent}%)
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon-sm" title="View" onClick={() => navigate(ROUTES.INSPECTION_REQUEST_DETAIL.replace(":id", r.id))}>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <PermissionGate permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE}>
                            <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => setDeleteTarget(r)} disabled={deleteMutation.isPending}>
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
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Inspection Request"
        description={`Delete request "${deleteTarget?.requestNo}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
    </div>
  );
}
