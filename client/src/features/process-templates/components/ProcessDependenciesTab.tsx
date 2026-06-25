// src/features/process-templates/components/ProcessDependenciesTab.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Info, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SelectField from "@/components/fields/SelectField";
import SwitchField from "@/components/fields/SwitchField";
import LongTextField from "@/components/fields/LongTextField";
import { useAllProcessTemplates, useTemplateDependencies, useAddTemplateDependency, useRemoveTemplateDependency } from "@/features/process-templates/process-templates.query";
import { addDependencySchema, REQUIRED_STATUS_OPTIONS } from "@/schemas/process-templates.schema";
import type { AddDependencyFormValues } from "@/schemas/process-templates.schema";
import type { ProcessDependency } from "@/features/process-templates/process-templates.api";

interface ProcessDependenciesTabProps {
  processTemplateId: string;
}

const DEFAULT_FORM: AddDependencyFormValues = { dependsOnId: "", requiredStatus: "COMPLETED", isRequired: true, applicabilityRule: "" };

export default function ProcessDependenciesTab({ processTemplateId }: ProcessDependenciesTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProcessDependency | undefined>();

  const { data: dependencies, isLoading } = useTemplateDependencies(processTemplateId);
  const { data: allTemplates } = useAllProcessTemplates();
  const addMutation = useAddTemplateDependency();
  const removeMutation = useRemoveTemplateDependency();

  const templateOptions = (allTemplates ?? [])
    .filter((t) => t.id !== processTemplateId)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((t) => ({ label: `[${t.sequenceOrder}] ${t.code} — ${t.name}`, value: t.id }));

  const form = useForm<AddDependencyFormValues>({
    resolver: zodResolver(addDependencySchema),
    defaultValues: DEFAULT_FORM,
  });

  function onAdd(values: AddDependencyFormValues) {
    const payload = { ...values, applicabilityRule: values.applicabilityRule || undefined };
    addMutation.mutate(
      { processTemplateId, data: payload },
      {
        onSuccess: () => {
          form.reset(DEFAULT_FORM);
          setShowAdd(false);
        },
      },
    );
  }

  function handleRemove() {
    if (!deleteTarget) return;
    removeMutation.mutate(
      { id: deleteTarget.id, templateId: processTemplateId },
      {
        onSuccess: () => setDeleteTarget(undefined),
      },
    );
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
        <Info className="size-4 shrink-0" />
        <p>
          Only add <strong>direct</strong> dependencies. Transitive dependencies are automatically inherited.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{dependencies?.length ?? 0} dependencies configured</p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus />
          Add Dependency
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={form.handleSubmit(onAdd)} className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <SelectField control={form.control} name="dependsOnId" label="Depends On Process" options={templateOptions} placeholder="Select process..." />
          <SelectField control={form.control} name="requiredStatus" label="Required Status" options={REQUIRED_STATUS_OPTIONS} />
          <LongTextField control={form.control} name="applicabilityRule" label="Applicability Rule" placeholder="Optional condition" rows={2} />
          <SwitchField control={form.control} name="isRequired" label="Required" description="Must be completed before this process" />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAdd(false);
                form.reset(DEFAULT_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      )}

      {(dependencies?.length ?? 0) === 0 ? (
        <EmptyState title="No dependencies" description="Add dependencies to specify which processes must be completed first." icon={GitBranch} />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Required Process</th>
                <th className="px-4 py-3 text-left font-medium">Required Status</th>
                <th className="px-4 py-3 text-left font-medium">Required</th>
                <th className="px-4 py-3 text-left font-medium">Applicability</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dependencies?.map((dep) => (
                <tr key={dep.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground mr-2">[{dep?.dependsOn?.sequenceOrder}]</span>
                    {dep.dependsOn.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={dep.requiredStatus === "COMPLETED" ? "secondary" : "outline"} className="text-xs">
                      {dep.requiredStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {dep.isRequired ? (
                      <Badge variant="secondary" className="text-xs">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{dep.applicabilityRule ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(dep)}>
                      <Trash2 className="text-destructive size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        title="Remove Dependency"
        description={`Remove dependency on "${deleteTarget?.dependsOn.name}"?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={removeMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
