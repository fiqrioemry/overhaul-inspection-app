// src/pages/AcceptanceCriteriaPage.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import PageHeader from "@/components/common/PageHeader";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import StatusBadge from "@/components/common/StatusBadge";
import LoadingState from "@/components/common/LoadingState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { PERMISSIONS } from "@/constants/permission.constant";
import PermissionGate from "@/components/common/PermissionGate";
import { ClipboardCheck, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import CriteriaDetailPanel from "@/features/acceptance-criteria/components/CriteriaDetailPanel";
import type { AcceptanceCriteria } from "@/features/acceptance-criteria/acceptance-criteria.api";
import AcceptanceCriteriaFormDialog from "@/features/acceptance-criteria/components/AcceptanceCriteriaFormDialog";
import { useAcceptanceCriteria, useDeleteAcceptanceCriteria } from "@/features/acceptance-criteria/acceptance-criteria.query";

export default function AcceptanceCriteriaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<AcceptanceCriteria | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AcceptanceCriteria | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useAcceptanceCriteria({ page, limit: 10, search: debouncedSearch });
  const deleteMutation = useDeleteAcceptanceCriteria();

  function openCreate() {
    setSelectedCriteria(undefined);
    setFormOpen(true);
  }

  function openEdit(criteria: AcceptanceCriteria) {
    setSelectedCriteria(criteria);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acceptance Criteria"
        description="Define technical acceptance criteria for tank inspection"
        action={
          <PermissionGate permission={PERMISSIONS.ACCEPTANCE_CRITERIA_CREATE}>
            <Button onClick={openCreate}>
              <Plus />
              Add Criteria
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search criteria..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load acceptance criteria." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {data && data?.items.length === 0 ? (
            <EmptyState title="No acceptance criteria" description="Add criteria to define inspection standards." icon={ClipboardCheck} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-8"></th>
                    <th className="px-4 py-3 text-left font-medium">Code</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Required</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Refs</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((criteria) => (
                    <>
                      <tr key={criteria.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => toggleExpand(criteria.id)}>
                        <td className="px-4 py-3 text-muted-foreground">{expandedId === criteria.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</td>
                        <td className="px-4 py-3 font-mono text-xs font-medium">{criteria.code}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{criteria.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{criteria.acceptanceType}</td>
                        <td className="px-4 py-3">
                          {criteria.isRequired ? (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Optional</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={criteria.status} />
                        </td>
                        <td className="px-4 py-3">
                          {(criteria.criteriaRefs?.length ?? 0) === 0 ? (
                            <span className="text-xs font-medium text-destructive">None</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {criteria.criteriaRefs?.map((ref) => (
                                <Badge key={ref.id} variant="outline" className="text-xs font-mono">
                                  {ref.referenceDocument.code}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <PermissionGate permission={PERMISSIONS.ACCEPTANCE_CRITERIA_UPDATE}>
                              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(criteria)}>
                                <Pencil />
                              </Button>
                            </PermissionGate>
                            <PermissionGate permission={PERMISSIONS.ACCEPTANCE_CRITERIA_CREATE}>
                              <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(criteria)}>
                                <Trash2 className="text-destructive" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                      {expandedId === criteria.id && (
                        <tr key={`${criteria.id}-detail`}>
                          <td colSpan={8} className="bg-muted/10 px-8 py-4">
                            <CriteriaDetailPanel criteria={criteria} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}

      <AcceptanceCriteriaFormDialog open={formOpen} onOpenChange={setFormOpen} criteria={selectedCriteria} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Delete Acceptance Criteria"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
