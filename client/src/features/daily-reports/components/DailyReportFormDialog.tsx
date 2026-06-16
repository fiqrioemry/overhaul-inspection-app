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
import { useCreateDailyReport, useUpdateDailyReport } from "../daily-reports.query";
import { format } from "date-fns";
import type { DailyReportSummary } from "../daily-reports.api";

const schema = z.object({
  reportDate: z.string().min(1, "Report date required"),
  activityType: z.enum(["MONITORING", "INSPECTION", "FINDING", "REPAIR", "TEST_ACTIVITY", "INFORMATION"]),
  description: z.string().min(1, "Description required").max(2000),
});

type FormValues = z.infer<typeof schema>;

export const ACTIVITY_OPTIONS = [
  { label: "Monitoring", value: "MONITORING" },
  { label: "Inspection", value: "INSPECTION" },
  { label: "Finding", value: "FINDING" },
  { label: "Repair", value: "REPAIR" },
  { label: "Test Activity", value: "TEST_ACTIVITY" },
  { label: "Information", value: "INFORMATION" },
];

export const ACTIVITY_LABEL: Record<string, string> = {
  MONITORING: "Monitoring",
  INSPECTION: "Inspection",
  FINDING: "Finding",
  REPAIR: "Repair",
  TEST_ACTIVITY: "Test Activity",
  INFORMATION: "Information",
};

interface DailyReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId: string;
  tankProcessId?: string;
  report?: DailyReportSummary;
}

export default function DailyReportFormDialog({ open, onOpenChange, tankId, tankProcessId, report }: DailyReportFormDialogProps) {
  const isEdit = Boolean(report);
  const createMutation = useCreateDailyReport();
  const updateMutation = useUpdateDailyReport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      reportDate: format(new Date(), "yyyy-MM-dd"),
      activityType: "MONITORING",
      description: "",
    },
  });

  useEffect(() => {
    if (open && report) {
      form.reset({
        reportDate: report.reportDate.slice(0, 10),
        activityType: report.activityType,
        description: report.description ?? "",
      });
    } else if (!open) {
      form.reset({ reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "MONITORING", description: "" });
    }
  }, [open, report, form]);

  function onSubmit(values: FormValues) {
    if (isEdit && report) {
      updateMutation.mutate(
        { id: report.id, data: { reportDate: values.reportDate, activityType: values.activityType, description: values.description } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        { tankId, tankProcessId: tankProcessId || undefined, reportDate: values.reportDate, activityType: values.activityType, description: values.description },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:h-auto! xl:w-110!">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Daily Report" : "Add Daily Report"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField control={form.control} name="activityType" label="Activity Type" options={ACTIVITY_OPTIONS} />
            <LongTextField control={form.control} name="description" label="Activity Description" placeholder="Describe the daily activities..." rows={5} maxLength={2000} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Report"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
