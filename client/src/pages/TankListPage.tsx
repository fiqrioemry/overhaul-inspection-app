// src/pages/TankListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import PermissionGate from "@/components/common/PermissionGate";
import { useTanks, useDeleteTank } from "@/features/tanks/tanks.query";
import type { TankSummary } from "@/features/tanks/tanks.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { TANK_LOCATION_LABEL, TANK_SERVICE_LABEL } from "@/schemas/tanks.schema";

export default function TankListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TankSummary | undefined>();

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useTanks({ page, limit: 15, search: debouncedSearch });
  const deleteMutation = useDeleteTank();

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tanks"
        description="Tank overhaul progress and inspection workflow"
        action={
          <PermissionGate permission={PERMISSIONS.TANK_CREATE}>
            <Button onClick={() => navigate(ROUTES.TANK_CREATE)}>
              <Plus /> Create Tank
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search tanks..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load tanks." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No tanks found" description="Create a tank to start the inspection workflow." icon={Container} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Tank No.</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Location</th>
                    <th className="px-4 py-3 text-left font-medium">Service</th>
                    <th className="px-4 py-3 text-left font-medium">Processes</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Start Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((tank) => {
                    const detailPath = ROUTES.TANK_DETAIL.replace(":tankId", tank.id);
                    return (
                      <tr key={tank.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(detailPath)}>
                        <td className="px-4 py-3 font-mono font-medium">{tank.tankNo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{tank.tankName ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{tank.location ? TANK_LOCATION_LABEL[tank.location] : "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{tank.service ? TANK_SERVICE_LABEL[tank.service] : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{tank._count.tankProcesses}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tank.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{tank.startDate ? format(new Date(tank.startDate), "dd MMM yyyy") : "—"}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon-sm" title="Detail tank" onClick={() => navigate(detailPath)}>
                              <Eye />
                            </Button>
                            <PermissionGate permission={PERMISSIONS.TANK_UPDATE}>
                              <Button variant="ghost" size="icon-sm" title="Delete tank" onClick={() => setDeleteTarget(tank)}>
                                <Trash2 className="text-destructive" />
                              </Button>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Delete Tank"
        description={`Delete tank "${deleteTarget?.tankNo}"? All associated processes and data will be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
