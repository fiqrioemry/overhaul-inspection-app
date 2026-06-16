// src/features/checklist-results/components/ChecklistResultDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/fields/SelectField";
import ShortTextField from "@/components/fields/ShortTextField";
import LongTextField from "@/components/fields/LongTextField";
import type { ChecklistResult } from "../checklist-results.api";
import { useUpdateChecklistResult } from "../checklist-results.query";

const schema = z.object({
  status: z.enum(["PENDING", "PASSED", "FAILED", "NOT_APPLICABLE"]),
  actualValue: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Passed", value: "PASSED" },
  { label: "Failed", value: "FAILED" },
  { label: "N/A", value: "NOT_APPLICABLE" },
];

interface ChecklistResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ChecklistResult | null;
  processId: string;
}

export default function ChecklistResultDialog({ open, onOpenChange, result, processId }: ChecklistResultDialogProps) {
  const mutation = useUpdateChecklistResult(processId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PENDING", actualValue: "", remarks: "" },
  });

  useEffect(() => {
    if (result) {
      form.reset({
        status: result.status,
        actualValue: result.actualValue ?? "",
        remarks: result.remarks ?? "",
      });
    }
  }, [result]);

  function onSubmit(values: FormValues) {
    if (!result) return;
    mutation.mutate(
      { id: result.id, data: values },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {result?.criteria.name ?? "Checklist Result"}
            </DialogTitle>
            {result?.criteria.acceptanceValue && (
              <p className="text-xs text-muted-foreground">Acceptance: {result.criteria.acceptanceValue}</p>
            )}
          </DialogHeader>

          <SelectField control={form.control} name="status" label="Result" options={STATUS_OPTIONS} />
          <ShortTextField control={form.control} name="actualValue" label="Actual Value" placeholder="Enter measured/actual value" />
          <LongTextField control={form.control} name="remarks" label="Remarks" placeholder="Optional notes" rows={3} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
