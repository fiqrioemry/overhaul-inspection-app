// src/features/daily-reports/components/DailyReportFormDialog.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { useCreateDailyReport } from "../daily-reports.query";
import { format } from "date-fns";

const schema = z.object({
  reportDate: z.string().min(1, "Report date required"),
  activityType: z.enum(["GENERAL", "FABRICATION", "INSPECTION", "TESTING", "COATING", "COMMISSIONING", "REPAIR", "OTHER"]),
  description: z.string().min(1, "Description required").max(2000),
});

type FormValues = z.infer<typeof schema>;

const ACTIVITY_OPTIONS = [
  { label: "General", value: "GENERAL" },
  { label: "Fabrication", value: "FABRICATION" },
  { label: "Inspection", value: "INSPECTION" },
  { label: "Testing", value: "TESTING" },
  { label: "Coating", value: "COATING" },
  { label: "Commissioning", value: "COMMISSIONING" },
  { label: "Repair", value: "REPAIR" },
  { label: "Other", value: "OTHER" },
];

interface DailyReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId: string;
  tankProcessId?: string;
}

export default function DailyReportFormDialog({ open, onOpenChange, tankId, tankProcessId }: DailyReportFormDialogProps) {
  const createMutation = useCreateDailyReport();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      reportDate: format(new Date(), "yyyy-MM-dd"),
      activityType: "GENERAL",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) form.reset({ reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "GENERAL", description: "" });
  }, [open, form]);

  function onSubmit(values: FormValues) {
    createMutation.mutate(
      {
        tankId,
        tankProcessId: tankProcessId || undefined,
        reportDate: values.reportDate,
        activityType: values.activityType,
        description: values.description,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Add Daily Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField control={form.control} name="activityType" label="Activity Type" options={ACTIVITY_OPTIONS} />
            <LongTextField control={form.control} name="description" label="Activity Description" placeholder="Describe the daily activities..." rows={5} maxLength={2000} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Create Report"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
