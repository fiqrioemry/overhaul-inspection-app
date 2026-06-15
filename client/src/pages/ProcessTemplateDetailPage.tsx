// src/pages/ProcessTemplateDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import PermissionGate from "@/components/common/PermissionGate";
import ProcessTemplateFormDialog from "@/features/process-templates/components/ProcessTemplateFormDialog";
import ProcessTemplateCriteriaTab from "@/features/process-templates/components/ProcessTemplateCriteriaTab";
import ProcessDependenciesTab from "@/features/process-templates/components/ProcessDependenciesTab";
import { useProcessTemplateById, useDeleteProcessTemplate } from "@/features/process-templates/process-templates.query";
import { PERMISSIONS } from "@/constants/permission.constant";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

export default function ProcessTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: template, isLoading, isError, refetch } = useProcessTemplateById(id!);
  const deleteMutation = useDeleteProcessTemplate();

  function handleDelete() {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => navigate(ROUTES.MASTER_PROCESS),
    });
  }

  if (isLoading) return <div className="p-6"><LoadingState /></div>;
  if (isError || !template) return <div className="p-6"><ErrorState message="Failed to load template." onRetry={() => refetch()} /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(ROUTES.MASTER_PROCESS)}>
            <ArrowLeft />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground">[{template.sequenceOrder}]</span>
              <span className="font-mono text-sm text-muted-foreground">{template.code}</span>
              <Badge variant="outline" className="text-xs">{template.type}</Badge>
              {template.isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
              <StatusBadge status={template.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <h1 className="text-2xl font-semibold">{template.name}</h1>
            {template.applicabilityRule && (
              <p className="text-sm text-muted-foreground mt-1">Applicability: {template.applicabilityRule}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Created {format(new Date(template.createdAt), "dd MMM yyyy")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGate permission={PERMISSIONS.MASTER_PROCESS_UPDATE}>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.MASTER_PROCESS_CREATE}>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="criteria">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm max-w-xl">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Code</p>
              <p className="font-mono">{template.code}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Type</p>
              <p>{template.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Sequence Order</p>
              <p>{template.sequenceOrder}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Optional</p>
              <p>{template.isOptional ? "Yes" : "No"}</p>
            </div>
            {template.applicabilityRule && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Applicability Rule</p>
                <p>{template.applicabilityRule}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="criteria" className="mt-4">
          <ProcessTemplateCriteriaTab processTemplateId={template.id} />
        </TabsContent>

        <TabsContent value="dependencies" className="mt-4">
          <ProcessDependenciesTab processTemplateId={template.id} />
        </TabsContent>
      </Tabs>

      <ProcessTemplateFormDialog open={editOpen} onOpenChange={setEditOpen} template={template} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Process Template"
        description={`Delete "${template.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
