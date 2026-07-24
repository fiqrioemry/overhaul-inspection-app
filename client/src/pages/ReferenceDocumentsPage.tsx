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
import FilterSelect from "@/components/fields/FilterSelect";
import ReferenceDocumentFormDialog from "@/features/reference-documents/components/ReferenceDocumentFormDialog";
import { useReferenceDocuments, useDeleteReferenceDocument } from "@/features/reference-documents/reference-documents.query";
import type { ReferenceDocument } from "@/features/reference-documents/reference-documents.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { DOCUMENT_TYPE_OPTIONS, REFERENCE_DOCUMENT_STATUS_OPTIONS } from "@/schemas/reference-documents.schema";
import { useDebounce } from "@/hooks/useDebounce";

export default function ReferenceDocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ReferenceDocument | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ReferenceDocument | undefined>();

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useReferenceDocuments({
    page,
    limit: 10,
    search: debouncedSearch,
    documentType: documentType || undefined,
    status: status || undefined,
  });
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
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <FilterSelect
            value={documentType}
            onChange={(v) => {
              setDocumentType(v);
              setPage(1);
            }}
            options={DOCUMENT_TYPE_OPTIONS}
            placeholder="Type"
            allLabel="All Types"
          />
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={REFERENCE_DOCUMENT_STATUS_OPTIONS}
            placeholder="Status"
            allLabel="All Status"
          />
          {(search || documentType || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setDocumentType("");
                setStatus("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load reference documents." onRetry={() => refetch()} />}

      <ReferenceDocumentFormDialog open={formOpen} onOpenChange={setFormOpen} document={selectedDoc} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
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
