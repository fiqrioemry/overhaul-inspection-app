// src/features/tank-processes/components/ProcessDatesDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DateField from "@/components/fields/DateField";
import { useUpdateProcessStatus, useUpdateProcessDates } from "../tank-processes.query";
import type { TankProcessDetail } from "../tank-processes.api";

const schema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  finishDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProcessDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "start" | "edit";
  process: TankProcessDetail;
}

export default function ProcessDatesDialog({ open, onOpenChange, mode, process }: ProcessDatesDialogProps) {
  const updateStatus = useUpdateProcessStatus();
  const updateDates = useUpdateProcessDates();
  const isPending = updateStatus.isPending || updateDates.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { startDate: "", finishDate: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "start") {
      form.reset({ startDate: format(new Date(), "yyyy-MM-dd"), finishDate: "" });
    } else {
      form.reset({
        startDate: process.startDate ? process.startDate.slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
        finishDate: process.finishDate ? process.finishDate.slice(0, 10) : "",
      });
    }
  }, [open, mode, process]);

  function onSubmit(values: FormValues) {
    const finishDate = values.finishDate || null;
    if (mode === "start") {
      updateStatus.mutate(
        { id: process.id, data: { status: "IN_PROGRESS", startDate: values.startDate, finishDate } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      updateDates.mutate(
        { id: process.id, data: { startDate: values.startDate, finishDate } },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-110!">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
          <DialogHeader>
            <DialogTitle>{mode === "start" ? "Start Process" : "Edit Process Dates"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="startDate" label="Started At" />
            <DateField control={form.control} name="finishDate" label="Completed At" clearable />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "start" ? "Start Process" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
