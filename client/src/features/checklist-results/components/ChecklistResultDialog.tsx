// src/features/checklist-results/components/ChecklistResultDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LongTextField from "@/components/fields/LongTextField";
import type { ChecklistResult } from "../checklist-results.api";
import { useCheckChecklist } from "../checklist-results.query";

const schema = z.object({
  remarks: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ChecklistResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ChecklistResult | null;
  processId: string;
}

export default function ChecklistResultDialog({ open, onOpenChange, result, processId }: ChecklistResultDialogProps) {
  const mutation = useCheckChecklist(processId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { remarks: "" },
  });

  useEffect(() => {
    if (open) form.reset({ remarks: result?.remarks ?? "" });
  }, [open, result]);

  function onSubmit(values: FormValues) {
    if (!result) return;
    mutation.mutate(
      { checklistId: result.id, data: { remarks: values.remarks || undefined } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {result?.nameDisplay ?? "Mark as Passed"}
            </DialogTitle>
            {result?.acceptanceDisplay && result.acceptanceDisplay !== "—" && (
              <p className="text-xs text-muted-foreground">Acceptance: {result.acceptanceDisplay}</p>
            )}
            {result?.referenceDisplay && result.referenceDisplay !== "—" && (
              <p className="text-xs text-muted-foreground font-mono">Ref: {result.referenceDisplay}</p>
            )}
          </DialogHeader>

          <LongTextField
            control={form.control}
            name="remarks"
            label="Remarks (optional)"
            placeholder="Add inspection notes or observations..."
            rows={3}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Mark as Passed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
