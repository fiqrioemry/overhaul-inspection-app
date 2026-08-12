// src/features/tank-projects/components/EditOverhaulProjectDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { useCompanyOptions } from "@/features/companies/companies.query";
import { useUpdateTankProject } from "../tank-projects.query";
import type { TankProjectSummary } from "@/features/tanks/tanks.api";

const NONE = "NONE";

const schema = z.object({
  contractorCompanyId: z.string().optional(),
  inspectionCompanyId: z.string().optional(),
  startDate: z.string().optional(),
  estimatedFinishDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  contractorCompanyId: NONE,
  inspectionCompanyId: NONE,
  startDate: "",
  estimatedFinishDate: "",
};

interface EditOverhaulProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: TankProjectSummary | null;
}

export default function EditOverhaulProjectDialog({ open, onOpenChange, project }: EditOverhaulProjectDialogProps) {
  const updateMutation = useUpdateTankProject();
  const { data: contractors = [] } = useCompanyOptions("CONTRACTOR");
  const { data: inspectionCompanies = [] } = useCompanyOptions("INSPECTOR_COMPANY");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && project) {
      form.reset({
        contractorCompanyId: project.contractorCompany?.id ?? NONE,
        inspectionCompanyId: project.inspectionCompany?.id ?? NONE,
        startDate: project.startDate ? project.startDate.slice(0, 10) : "",
        estimatedFinishDate: project.estimatedFinishDate ? project.estimatedFinishDate.slice(0, 10) : "",
      });
    } else if (!open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, project]);

  const contractorOptions = [{ label: "None", value: NONE }, ...contractors.map((c) => ({ label: c.name, value: c.id }))];
  const inspectionOptions = [{ label: "None", value: NONE }, ...inspectionCompanies.map((c) => ({ label: c.name, value: c.id }))];

  function onSubmit(values: FormValues) {
    if (!project) return;
    updateMutation.mutate(
      {
        id: project.id,
        data: {
          contractorCompanyId: values.contractorCompanyId && values.contractorCompanyId !== NONE ? values.contractorCompanyId : null,
          inspectionCompanyId: values.inspectionCompanyId && values.inspectionCompanyId !== NONE ? values.inspectionCompanyId : null,
          startDate: values.startDate || null,
          estimatedFinishDate: values.estimatedFinishDate || null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-110!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>Edit Project{project ? ` — ${project.projectNo}` : ""}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="startDate" label="Start Date" clearable />
            <DateField control={form.control} name="estimatedFinishDate" label="Est. Finish Date" clearable />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField control={form.control} name="contractorCompanyId" label="Contractor" options={contractorOptions} />
            <SelectField control={form.control} name="inspectionCompanyId" label="Inspection Company" options={inspectionOptions} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
