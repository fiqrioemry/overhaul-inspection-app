// src/features/process-templates/components/ProcessTemplateFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import SwitchField from "@/components/fields/SwitchField";
import { createProcessTemplateSchema, PROCESS_TYPE_OPTIONS } from "@/schemas/process-templates.schema";
import type { CreateProcessTemplateFormValues } from "@/schemas/process-templates.schema";
import { useCreateProcessTemplate, useUpdateProcessTemplate } from "@/features/process-templates/process-templates.query";
import type { ProcessTemplate } from "@/features/process-templates/process-templates.api";

interface ProcessTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ProcessTemplate;
}

const DEFAULT_VALUES: CreateProcessTemplateFormValues = {
  code: "",
  name: "",
  type: "INSPECTION",
  sequenceOrder: 0,
  isOptional: false,
  applicabilityRule: "",
  isActive: true,
};

export default function ProcessTemplateFormDialog({ open, onOpenChange, template }: ProcessTemplateFormDialogProps) {
  const isEdit = Boolean(template);
  const createMutation = useCreateProcessTemplate();
  const updateMutation = useUpdateProcessTemplate();

  const form = useForm<CreateProcessTemplateFormValues>({
    resolver: zodResolver(createProcessTemplateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (template && isEdit) {
      form.reset({
        code: template.code,
        name: template.name,
        type: template.type as CreateProcessTemplateFormValues["type"],
        sequenceOrder: template.sequenceOrder,
        isOptional: template.isOptional,
        applicabilityRule: template.applicabilityRule ?? "",
        isActive: template.isActive,
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [template, open]);

  function onSubmit(values: CreateProcessTemplateFormValues) {
    const payload = { ...values, applicabilityRule: values.applicabilityRule || undefined };
    if (isEdit && template) {
      updateMutation.mutate({ id: template.id, data: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Process Template" : "Add Process Template"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <ShortTextField control={form.control} name="code" label="Code" placeholder="e.g. PT-001" />
            <ShortTextField control={form.control} name="sequenceOrder" label="Sequence Order" placeholder="0" type="text" />
          </div>

          <ShortTextField control={form.control} name="name" label="Name" placeholder="Process name" />
          <SelectField control={form.control} name="type" label="Type" options={PROCESS_TYPE_OPTIONS} />
          <LongTextField control={form.control} name="applicabilityRule" label="Applicability Rule" placeholder="Optional rule" rows={2} />

          <div className="grid grid-cols-2 gap-4">
            <SwitchField control={form.control} name="isOptional" label="Optional" description="Not required in all inspections" />
            <SwitchField control={form.control} name="isActive" label="Active" description="Available for use" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
