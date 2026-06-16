// src/features/daily-reports/components/DailyReportFormDialog.tsx
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { X, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { ImageDropzone } from "@/components/fields/ImageDropzone";
import { useCreateDailyReport, useUpdateDailyReport, useDailyReport } from "../daily-reports.query";
import { format } from "date-fns";
import { uploadFile } from "@/features/files/files.api";
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

interface PendingFile {
  file: File;
  previewUrl: string;
  uploading: boolean;
  fileId?: string;
  error?: boolean;
}

interface DailyReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tankId: string;
  tankProcessId?: string;
  report?: DailyReportSummary;
}

const MAX_TOTAL_ATTACHMENTS = 10;

export default function DailyReportFormDialog({ open, onOpenChange, tankId, tankProcessId, report }: DailyReportFormDialogProps) {
  const isEdit = Boolean(report);
  const createMutation = useCreateDailyReport();
  const updateMutation = useUpdateDailyReport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedExistingIds, setRemovedExistingIds] = useState<Set<string>>(new Set());

  const { data: detail } = useDailyReport(report?.id ?? "");

  const existingAttachments = (isEdit ? (detail?.attachments ?? []) : []).filter((att) => !removedExistingIds.has(att.id));

  const totalAttachmentCount = existingAttachments.length + pendingFiles.length;

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
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingFiles([]);
      setRemovedExistingIds(new Set());
    }
  }, [open, report, form]);

  const handleDrop = useCallback(
    async (files: File[]) => {
      const available = MAX_TOTAL_ATTACHMENTS - totalAttachmentCount;
      const toAdd = files.slice(0, available);
      if (!toAdd.length) return;

      const newPending: PendingFile[] = toAdd.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: true,
      }));

      setPendingFiles((prev) => [...prev, ...newPending]);

      for (const item of newPending) {
        try {
          const result = await uploadFile(item.file, "DAILY_REPORT");
          setPendingFiles((prev) => prev.map((p) => (p.previewUrl === item.previewUrl ? { ...p, uploading: false, fileId: result.id } : p)));
        } catch {
          setPendingFiles((prev) => prev.map((p) => (p.previewUrl === item.previewUrl ? { ...p, uploading: false, error: true } : p)));
        }
      }
    },
    [totalAttachmentCount],
  );

  function removePending(previewUrl: string) {
    setPendingFiles((prev) => {
      const removed = prev.find((p) => p.previewUrl === previewUrl);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.previewUrl !== previewUrl);
    });
  }

  function removeExisting(id: string) {
    setRemovedExistingIds((prev) => new Set(prev).add(id));
  }

  function onSubmit(values: FormValues) {
    const fileIds = [
      ...existingAttachments.map((a) => a.id),
      ...pendingFiles.filter((p) => p.fileId).map((p) => p.fileId!),
    ];

    if (isEdit && report) {
      updateMutation.mutate(
        { id: report.id, data: { reportDate: values.reportDate, activityType: values.activityType, description: values.description, fileIds } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        { tankId, tankProcessId: tankProcessId || undefined, reportDate: values.reportDate, activityType: values.activityType, description: values.description, fileIds },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  const hasUploadInProgress = pendingFiles.some((p) => p.uploading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-120! max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Daily Report" : "Add Daily Report"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField control={form.control} name="activityType" label="Activity Type" options={ACTIVITY_OPTIONS} />
            <LongTextField control={form.control} name="description" label="Activity Description" placeholder="Describe the daily activities..." rows={4} maxLength={2000} />

            {/* Existing attachments (edit mode) */}
            {existingAttachments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Existing Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((att) => (
                    <div key={att.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group bg-muted">
                      <img src={att.url} alt="" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removeExisting(att.id)}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending (newly uploaded) files */}
            {pendingFiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">New Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((p) => (
                    <div key={p.previewUrl} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group bg-muted">
                      <img src={p.previewUrl} alt={p.file.name} className="w-full h-full object-contain" />
                      {p.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="size-5 animate-spin text-white" />
                        </div>
                      )}
                      {p.error && (
                        <div className="absolute inset-0 bg-destructive/50 flex flex-col items-center justify-center gap-1">
                          <AlertCircle className="size-5 text-white" />
                          <span className="text-[10px] text-white font-medium">Failed</span>
                        </div>
                      )}
                      {!p.uploading && (
                        <button
                          type="button"
                          onClick={() => removePending(p.previewUrl)}
                          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dropzone */}
            {totalAttachmentCount < MAX_TOTAL_ATTACHMENTS && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Attachments (Photo Evidence)</p>
                <ImageDropzone onDrop={handleDrop} maxFiles={MAX_TOTAL_ATTACHMENTS} currentCount={totalAttachmentCount} disabled={hasUploadInProgress} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || hasUploadInProgress}>
                {isPending ? "Saving..." : hasUploadInProgress ? "Uploading..." : isEdit ? "Save Changes" : "Create Report"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
