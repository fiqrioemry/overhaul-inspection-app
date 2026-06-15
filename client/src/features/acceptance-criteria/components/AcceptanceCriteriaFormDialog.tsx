// src/features/acceptance-criteria/components/AcceptanceCriteriaFormDialog.tsx
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import SwitchField from "@/components/fields/SwitchField";
import {
  createAcceptanceCriteriaSchema,
  ACCEPTANCE_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  ACCEPTANCE_CRITERIA_STATUS_OPTIONS,
} from "@/schemas/acceptance-criteria.schema";
import type { CreateAcceptanceCriteriaFormValues } from "@/schemas/acceptance-criteria.schema";
import { useCreateAcceptanceCriteria, useUpdateAcceptanceCriteria } from "@/features/acceptance-criteria/acceptance-criteria.query";
import type { AcceptanceCriteria } from "@/features/acceptance-criteria/acceptance-criteria.api";

interface AcceptanceCriteriaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criteria?: AcceptanceCriteria;
}

const DEFAULT_VALUES: CreateAcceptanceCriteriaFormValues = {
  code: "",
  name: "",
  description: "",
  acceptanceType: "PASS_FAIL",
  isCountable: false,
  isRequired: true,
  status: "ACTIVE",
};

export default function AcceptanceCriteriaFormDialog({ open, onOpenChange, criteria }: AcceptanceCriteriaFormDialogProps) {
  const isEdit = Boolean(criteria);
  const createMutation = useCreateAcceptanceCriteria();
  const updateMutation = useUpdateAcceptanceCriteria();

  const form = useForm<CreateAcceptanceCriteriaFormValues>({
    resolver: zodResolver(createAcceptanceCriteriaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const acceptanceType = useWatch({ control: form.control, name: "acceptanceType" });

  useEffect(() => {
    if (criteria && isEdit) {
      form.reset({
        code: criteria.code,
        name: criteria.name,
        description: criteria.description ?? "",
        acceptanceType: criteria.acceptanceType as CreateAcceptanceCriteriaFormValues["acceptanceType"],
        minValue: criteria.minValue ?? undefined,
        maxValue: criteria.maxValue ?? undefined,
        unit: criteria.unit ?? "",
        acceptanceText: criteria.acceptanceText ?? "",
        method: criteria.method ?? "",
        tools: criteria.tools ?? "",
        isCountable: criteria.isCountable,
        isRequired: criteria.isRequired,
        severity: criteria.severity ?? "",
        status: criteria.status as CreateAcceptanceCriteriaFormValues["status"],
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [criteria, open]);

  function onSubmit(values: CreateAcceptanceCriteriaFormValues) {
    const payload = {
      ...values,
      minValue: values.minValue,
      maxValue: values.maxValue,
    };

    if (isEdit && criteria) {
      updateMutation.mutate({ id: criteria.id, data: payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const showNumericMin = acceptanceType === "NUMERIC_MIN" || acceptanceType === "NUMERIC_RANGE";
  const showNumericMax = acceptanceType === "NUMERIC_MAX" || acceptanceType === "NUMERIC_RANGE";
  const showUnit = showNumericMin || showNumericMax;
  const showText = acceptanceType === "TEXT" || acceptanceType === "DEPENDENCY";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Acceptance Criteria" : "Add Acceptance Criteria"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <ShortTextField control={form.control} name="code" label="Code" placeholder="e.g. AC-001" />
            <SelectField control={form.control} name="status" label="Status" options={ACCEPTANCE_CRITERIA_STATUS_OPTIONS} />
          </div>

          <ShortTextField control={form.control} name="name" label="Name" placeholder="Criteria name" />
          <LongTextField control={form.control} name="description" label="Description" placeholder="Optional description" rows={2} />

          <SelectField control={form.control} name="acceptanceType" label="Acceptance Type" options={ACCEPTANCE_TYPE_OPTIONS} />

          {showNumericMin && (
            <ShortTextField control={form.control} name="minValue" label="Minimum Value" placeholder="Min" type="text" />
          )}
          {showNumericMax && (
            <ShortTextField control={form.control} name="maxValue" label="Maximum Value" placeholder="Max" type="text" />
          )}
          {showUnit && (
            <ShortTextField control={form.control} name="unit" label="Unit" placeholder="e.g. mm, °C" />
          )}
          {showText && (
            <LongTextField control={form.control} name="acceptanceText" label="Acceptance Text" placeholder="Define acceptance text" rows={2} />
          )}

          <ShortTextField control={form.control} name="method" label="Method" placeholder="Inspection method" />
          <ShortTextField control={form.control} name="tools" label="Tools" placeholder="Required tools/equipment" />
          <SelectField control={form.control} name="severity" label="Severity" options={SEVERITY_OPTIONS} placeholder="Select severity (optional)" />

          <div className="grid grid-cols-2 gap-4">
            <SwitchField control={form.control} name="isRequired" label="Required" description="Must be checked on every inspection" />
            <SwitchField control={form.control} name="isCountable" label="Countable" description="Count instances found" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Criteria"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
