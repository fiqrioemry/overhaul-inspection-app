// src/pages/ReferenceDocumentsPage.tsx
import { useState } from "react";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
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
import ReferenceDocumentFormDialog from "@/features/reference-documents/components/ReferenceDocumentFormDialog";
import { useReferenceDocuments, useDeleteReferenceDocument } from "@/features/reference-documents/reference-documents.query";
import type { ReferenceDocument } from "@/features/reference-documents/reference-documents.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { useDebounce } from "@/hooks/useDebounce";

export default function ReferenceDocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ReferenceDocument | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ReferenceDocument | undefined>();

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useReferenceDocuments({ page, limit: 10, search: debouncedSearch });
  const deleteMutation = useDeleteReferenceDocument();

  function openCreate() {
    setSelectedDoc(undefined);
    setFormOpen(true);
  }

  function openEdit(doc: ReferenceDocument) {
    setSelectedDoc(doc);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reference Documents"
        description="Manage reference documents used as acceptance criteria sources"
        action={
          <PermissionGate permission={PERMISSIONS.REFERENCE_DOCUMENT_CREATE}>
            <Button onClick={openCreate}>
              <Plus />
              Add Document
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load reference documents." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {data && data.items.length === 0 ? (
            <EmptyState title="No reference documents" description="Add a reference document to get started." icon={FileText} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Code</th>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Revision</th>
                    <th className="px-4 py-3 text-left font-medium">Issuer</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.items.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium font-mono text-xs">{doc.code}</td>
                      <td className="px-4 py-3">{doc.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.documentType}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.revision ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.issuer ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <PermissionGate permission={PERMISSIONS.REFERENCE_DOCUMENT_UPDATE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(doc)}>
                              <Pencil />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.REFERENCE_DOCUMENT_CREATE}>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(doc)}>
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

      <ReferenceDocumentFormDialog open={formOpen} onOpenChange={setFormOpen} document={selectedDoc} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(undefined); }}
        title="Delete Reference Document"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
