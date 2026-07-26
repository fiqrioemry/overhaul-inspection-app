// src/pages/ProcessTemplatesPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import PermissionGate from "@/components/common/PermissionGate";
import FilterSelect from "@/components/fields/FilterSelect";
import ProcessTemplateFormDialog from "@/features/process-templates/components/ProcessTemplateFormDialog";
import { useProcessTemplates, useDeleteProcessTemplate } from "@/features/process-templates/process-templates.query";
import type { ProcessTemplate } from "@/features/process-templates/process-templates.api";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { useDebounce } from "@/hooks/useDebounce";
import { PROCESS_TYPE_OPTIONS } from "@/schemas/process-templates.schema";

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

export default function ProcessTemplatesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ProcessTemplate | undefined>();

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading, isError, refetch } = useProcessTemplates({
    page,
    limit: 20,
    search: debouncedSearch,
    type: type || undefined,
    isActive: status === "" ? undefined : status === "true",
  });
  const deleteMutation = useDeleteProcessTemplate();

  // Sort by sequenceOrder
  const sortedItems = [...(data?.items ?? [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  function openCreate() {
    setSelectedTemplate(undefined);
    setFormOpen(true);
  }

  function openEdit(template: ProcessTemplate) {
    setSelectedTemplate(template);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  }

  function goToDetail(id: string) {
    navigate(ROUTES.PROCESS_TEMPLATE_DETAIL.replace(":id", id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Process Templates"
        description="Define inspection process templates and their criteria mappings"
        action={
          <PermissionGate permission={PERMISSIONS.MASTER_PROCESS_CREATE}>
            <Button onClick={openCreate}>
              <Plus />
              Add Template
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <FilterSelect
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={PROCESS_TYPE_OPTIONS}
            placeholder="Type"
            allLabel="All Types"
          />
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Status"
            allLabel="All Status"
          />
          {(search || type || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setType("");
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
      {isError && <ErrorState message="Failed to load process templates." onRetry={() => refetch()} />}

      <ProcessTemplateFormDialog open={formOpen} onOpenChange={setFormOpen} template={selectedTemplate} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Delete Process Template"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
