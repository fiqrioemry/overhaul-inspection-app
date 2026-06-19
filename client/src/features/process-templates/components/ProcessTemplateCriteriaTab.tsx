// src/features/process-templates/components/ProcessTemplateCriteriaTab.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SelectField from "@/components/fields/SelectField";
import SwitchField from "@/components/fields/SwitchField";
import { useAllAcceptanceCriteria } from "@/features/acceptance-criteria/acceptance-criteria.query";
import { useTemplateCriteria, useAddCriteriaToTemplate, useRemoveTemplateCriteria } from "@/features/process-templates/process-templates.query";
import { addCriteriaToTemplateSchema } from "@/schemas/process-templates.schema";
import type { AddCriteriaToTemplateFormValues } from "@/schemas/process-templates.schema";
import type { ProcessCriteriaTemplate } from "@/features/process-templates/process-templates.api";

interface ProcessTemplateCriteriaTabProps {
  processTemplateId: string;
}

const DEFAULT_FORM: AddCriteriaToTemplateFormValues = { criteriaId: "", sequenceOrder: 0, isRequired: true };

export default function ProcessTemplateCriteriaTab({ processTemplateId }: ProcessTemplateCriteriaTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProcessCriteriaTemplate | undefined>();

  const { data: criteria, isLoading } = useTemplateCriteria(processTemplateId);
  const { data: allCriteria } = useAllAcceptanceCriteria();
  const addMutation = useAddCriteriaToTemplate();
  const removeMutation = useRemoveTemplateCriteria();

  const criteriaOptions = (allCriteria ?? []).map((c) => ({ label: `${c.code} — ${c.name}`, value: c.id }));

  const form = useForm<AddCriteriaToTemplateFormValues>({
    resolver: zodResolver(addCriteriaToTemplateSchema),
    defaultValues: DEFAULT_FORM,
  });

  function onAdd(values: AddCriteriaToTemplateFormValues) {
    addMutation.mutate({ processTemplateId, data: values }, {
      onSuccess: () => {
        form.reset(DEFAULT_FORM);
        setShowAdd(false);
      },
    });
  }

  function handleRemove() {
    if (!deleteTarget) return;
    removeMutation.mutate({ id: deleteTarget.id, templateId: processTemplateId }, {
      onSuccess: () => setDeleteTarget(undefined),
    });
  }

  if (isLoading) return <LoadingState />;

  const sorted = [...(criteria ?? [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sorted.length} criteria assigned</p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus />
          Add Criteria
        </Button>
      </div>

      {showAdd && (
        <form onSubmit={form.handleSubmit(onAdd)} className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <SelectField control={form.control} name="criteriaId" label="Acceptance Criteria" options={criteriaOptions} placeholder="Select criteria..." />
          <SwitchField control={form.control} name="isRequired" label="Required" />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); form.reset(DEFAULT_FORM); }}>Cancel</Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add"}</Button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <EmptyState title="No criteria assigned" description="Add acceptance criteria to this process template." icon={ClipboardCheck} />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-12">Seq</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Required</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{item.sequenceOrder}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.criteria.code}</td>
                  <td className="px-4 py-3">{item.criteria.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.criteria.acceptanceType}</td>
                  <td className="px-4 py-3">
                    {item.isRequired ? (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(item)}>
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
        onOpenChange={(open) => { if (!open) setDeleteTarget(undefined); }}
        title="Remove Criteria"
        description={`Remove "${deleteTarget?.criteria.name}" from this template?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={removeMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
