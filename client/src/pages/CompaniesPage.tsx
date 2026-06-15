// src/pages/CompaniesPage.tsx
import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import PermissionGate from "@/components/common/PermissionGate";
import CompanyFormDialog from "@/features/companies/components/CompanyFormDialog";
import { useCompanies, useDeleteCompany } from "@/features/companies/companies.query";
import type { Company } from "@/features/companies/companies.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Company | undefined>();

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useCompanies({ page, limit: 10, search: debouncedSearch });
  const deleteMutation = useDeleteCompany();

  function openCreate() {
    setSelectedCompany(undefined);
    setFormOpen(true);
  }

  function openEdit(company: Company) {
    setSelectedCompany(company);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage companies involved in tank inspection projects"
        action={
          <PermissionGate permission={PERMISSIONS.COMPANY_CREATE}>
            <Button onClick={openCreate}>
              <Plus />
              Add Company
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load companies." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {data && data.items.length === 0 ? (
            <EmptyState title="No companies found" description="Add a company to get started." icon={Building2} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((company) => (
                    <tr key={company.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{company.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{company.role}</td>
                      <td className="px-4 py-3"><StatusBadge status={company.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(company.createdAt), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGate permission={PERMISSIONS.COMPANY_UPDATE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(company)}>
                              <Pencil />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.COMPANY_CREATE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(company)}>
                              <Trash2 className="text-destructive" />
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

          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} onPageChange={setPage} />
          )}
        </>
      )}

      <CompanyFormDialog open={formOpen} onOpenChange={setFormOpen} company={selectedCompany} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(undefined); }}
        title="Delete Company"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
