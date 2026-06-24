// src/features/tank-projects/components/CreateOverhaulProjectDialog.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { useCompanyOptions } from "@/features/companies/companies.query";
import { useAllProcessTemplates } from "@/features/process-templates/process-templates.query";
import { useCreateTankProject } from "../tank-projects.query";

const NONE = "NONE";

const schema = z.object({
  type: z.enum(["NEW_BUILD", "OVERHAUL", "REPAIR", "ROUTINE_INSPECTION"]).default("OVERHAUL"),
  projectNo: z.string().optional(),
  contractorCompanyId: z.string().optional(),
  inspectionCompanyId: z.string().optional(),
  startDate: z.string().optional(),
  estimatedFinishDate: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PROJECT_TYPE_OPTIONS = [
  { label: "Overhaul", value: "OVERHAUL" },
  { label: "New Build", value: "NEW_BUILD" },
  { label: "Repair", value: "REPAIR" },
  { label: "Routine Inspection", value: "ROUTINE_INSPECTION" },
];

interface CreateOverhaulProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId: string;
  tankNo: string;
}

export default function CreateOverhaulProjectDialog({ open, onOpenChange, tankId, tankNo }: CreateOverhaulProjectDialogProps) {
  const createMutation = useCreateTankProject();
  const { data: contractors = [] } = useCompanyOptions("CONTRACTOR");
  const { data: inspectionCompanies = [] } = useCompanyOptions("INSPECTOR_COMPANY");
  const { data: templates = [] } = useAllProcessTemplates();

  // Workflow generation: ON = generate the full template set, OFF = pick specific templates.
  const [generateAll, setGenerateAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeTemplates = templates
    .filter((t) => t.isActive)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      type: "OVERHAUL",
      projectNo: "",
      contractorCompanyId: NONE,
      inspectionCompanyId: NONE,
      startDate: "",
      estimatedFinishDate: "",
      description: "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
      setGenerateAll(true);
      setSelectedIds(new Set());
    }
    onOpenChange(next);
  }

  const contractorOptions = [{ label: "None", value: NONE }, ...contractors.map((c) => ({ label: c.name, value: c.id }))];
  const inspectionOptions = [{ label: "None", value: NONE }, ...inspectionCompanies.map((c) => ({ label: c.name, value: c.id }))];

  function toggleTemplate(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const selectionInvalid = !generateAll && selectedIds.size === 0;

  function onSubmit(values: FormValues) {
    if (selectionInvalid) return;
    createMutation.mutate(
      {
        tankId,
        type: values.type,
        projectNo: values.projectNo?.trim() || undefined,
        contractorCompanyId: values.contractorCompanyId && values.contractorCompanyId !== NONE ? values.contractorCompanyId : undefined,
        inspectionCompanyId: values.inspectionCompanyId && values.inspectionCompanyId !== NONE ? values.inspectionCompanyId : undefined,
        startDate: values.startDate || undefined,
        estimatedFinishDate: values.estimatedFinishDate || undefined,
        description: values.description?.trim() || undefined,
        generateProcesses: true,
        processTemplateIds: generateAll ? undefined : Array.from(selectedIds),
      },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="xl:w-150! max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Start Overhaul Project — {tankNo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectField control={form.control} name="type" label="Project Type" options={PROJECT_TYPE_OPTIONS} />
              <ShortTextField control={form.control} name="projectNo" label="Project No. (optional)" placeholder="Auto-generated if empty" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DateField control={form.control} name="startDate" label="Start Date" />
              <DateField control={form.control} name="estimatedFinishDate" label="Est. Finish Date" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField control={form.control} name="contractorCompanyId" label="Contractor" options={contractorOptions} />
              <SelectField control={form.control} name="inspectionCompanyId" label="Inspection Company" options={inspectionOptions} />
            </div>
            <LongTextField control={form.control} name="description" label="Description" placeholder="Scope / notes..." rows={2} />

            <Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FieldLabel>Generate all processes</FieldLabel>
                  <FieldDescription>
                    {generateAll
                      ? "All standard process templates will be generated for this project."
                      : "Choose which process templates to include."}
                  </FieldDescription>
                </div>
                <Switch checked={generateAll} onCheckedChange={setGenerateAll} />
              </div>

              {!generateAll && (
                <div className="mt-2 rounded-lg border divide-y max-h-64 overflow-y-auto">
                  {activeTemplates.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No active process templates available.</p>
                  ) : (
                    activeTemplates.map((t) => (
                      <label key={t.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/30">
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={(checked) => toggleTemplate(t.id, checked === true)}
                        />
                        <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{t.code}</span>
                        <span className="text-sm">{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
              {selectionInvalid && <FieldError errorText="Select at least one process template." />}
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || selectionInvalid}>
                {createMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ errorText }: { errorText: string }) {
  return <p className="mt-1.5 text-xs text-destructive">{errorText}</p>;
}
