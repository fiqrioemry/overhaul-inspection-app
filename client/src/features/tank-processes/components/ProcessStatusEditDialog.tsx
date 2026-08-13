// src/features/tank-processes/components/ProcessStatusEditDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/fields/SelectField";
import ProcessStatusBadge from "@/components/common/ProcessStatusBadge";
import { PROCESS_STATUS_OPTIONS } from "@/constants/process.constant";
import { useCorrectProcessStatus } from "../tank-processes.query";
import type { ProcessStatus, TankProcessSummary } from "../tank-processes.api";

// The select is the only input, and it is constrained to the five workflow statuses — an
// arbitrary string cannot reach the mutation even if the field were tampered with.
const schema = z.object({
  targetStatus: z.enum(["NOT_STARTED", "IN_PROGRESS", "WAITING_REVIEW", "REVIEWED", "COMPLETED"]),
});

type FormValues = z.infer<typeof schema>;

interface ProcessStatusEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId: string;
  process: TankProcessSummary;
}

export default function ProcessStatusEditDialog({ open, onOpenChange, tankId, process }: ProcessStatusEditDialogProps) {
  const correctStatus = useCorrectProcessStatus();
  const isPending = correctStatus.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { targetStatus: undefined },
  });

  // Reset only when the dialog opens. A failed submit leaves the dialog mounted and open, so
  // the operator's selection survives the error and can be retried as-is.
  useEffect(() => {
    if (open) form.reset({ targetStatus: undefined });
  }, [open]);

  const targetStatus = form.watch("targetStatus");
  // The current status is not offered as a target, so a no-op correction cannot be submitted.
  const options = PROCESS_STATUS_OPTIONS.filter((opt) => opt.value !== process.status);
  const canSubmit = Boolean(targetStatus) && targetStatus !== process.status;
  const isReopeningCompleted = process.status === "COMPLETED" && Boolean(targetStatus) && targetStatus !== "COMPLETED";

  function onSubmit(values: FormValues) {
    correctStatus.mutate(
      {
        tankId,
        processId: process.id,
        // The status rendered when the dialog opened — the server refuses the write if the row
        // has moved on since, rather than overwriting the newer value.
        data: { targetStatus: values.targetStatus as ProcessStatus, expectedCurrentStatus: process.status },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="xl:w-110!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>Edit Process Status</DialogTitle>
            <DialogDescription>This manually changes the process status and may bypass the normal checklist and review workflow. Checklist results and other processes will not be changed.</DialogDescription>
          </DialogHeader>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-medium">{process.name}</p>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{process.processTemplate.code}</span>
              <span>·</span>
              <span>Current status</span>
              <ProcessStatusBadge status={process.status} />
            </div>
          </div>

          <SelectField control={form.control} name="targetStatus" label="New Status" options={options} placeholder="Select a status" disabled={isPending} />

          {isReopeningCompleted && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Reopening this process will clear its completion timestamp. Existing checklist results and downstream process statuses will remain unchanged.</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
