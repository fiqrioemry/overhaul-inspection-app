// src/features/daily-reports/components/DailyReportFormDialog.tsx
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { X, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { ImageDropzone } from "@/components/fields/ImageDropzone";
import { useCreateDailyReport, useUpdateDailyReport, useDailyReport } from "../daily-reports.query";
import { format } from "date-fns";
import type { DailyReportSummary, DailyReportAttachment } from "../daily-reports.api";

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

const MAX_ATTACHMENTS = 15;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface LocalFile {
  file: File;
  previewUrl: string;
}

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

  const { data: detail } = useDailyReport(report?.id ?? "");

  // Local new files (not yet uploaded)
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  // IDs of existing attachments to remove
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  // Editable captions for existing attachments (keyed by attachmentId)
  const [captionMap, setCaptionMap] = useState<Record<string, string>>({});
  // Validation error message
  const [fileError, setFileError] = useState<string | null>(null);

  const existingAttachments: DailyReportAttachment[] = (detail?.attachments ?? []).filter((a) => !removedIds.has(a.id));
  const totalCount = existingAttachments.length + localFiles.length;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "MONITORING", description: "" },
  });

  useEffect(() => {
    if (open && report) {
      form.reset({
        reportDate: report.reportDate.slice(0, 10),
        activityType: report.activityType,
        description: report.description ?? "",
      });
      // Init captions from detail
      if (detail?.attachments) {
        const initial: Record<string, string> = {};
        detail.attachments.forEach((a) => { initial[a.id] = a.caption ?? ""; });
        setCaptionMap(initial);
      }
    } else if (!open) {
      form.reset({ reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "MONITORING", description: "" });
      localFiles.forEach((lf) => URL.revokeObjectURL(lf.previewUrl));
      setLocalFiles([]);
      setRemovedIds(new Set());
      setCaptionMap({});
      setFileError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report]);

  // Re-init captions when detail loads during edit
  useEffect(() => {
    if (isEdit && detail?.attachments) {
      setCaptionMap((prev) => {
        const next = { ...prev };
        detail.attachments.forEach((a) => { if (!(a.id in next)) next[a.id] = a.caption ?? ""; });
        return next;
      });
    }
  }, [detail, isEdit]);

  const handleDrop = useCallback(
    (files: File[]) => {
      setFileError(null);
      const available = MAX_ATTACHMENTS - totalCount;
      const toAdd = files.slice(0, available);
      const errors: string[] = [];

      const valid: LocalFile[] = [];
      for (const file of toAdd) {
        if (!ALLOWED_TYPES.has(file.type)) {
          errors.push(`"${file.name}" is not a supported image type (jpeg/png/webp).`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`"${file.name}" exceeds 8 MB.`);
          continue;
        }
        valid.push({ file, previewUrl: URL.createObjectURL(file) });
      }

      if (errors.length) setFileError(errors[0]);
      if (valid.length) setLocalFiles((prev) => [...prev, ...valid]);
    },
    [totalCount],
  );

  function removeLocal(previewUrl: string) {
    setLocalFiles((prev) => {
      const removed = prev.find((lf) => lf.previewUrl === previewUrl);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((lf) => lf.previewUrl !== previewUrl);
    });
  }

  function removeExisting(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
  }

  function onSubmit(values: FormValues) {
    const captions = Object.entries(captionMap)
      .filter(([attachmentId]) => existingAttachments.some((a) => a.id === attachmentId))
      .map(([attachmentId, caption]) => ({ attachmentId, caption }));

    if (isEdit && report) {
      updateMutation.mutate(
        {
          id: report.id,
          data: {
            reportDate: values.reportDate,
            activityType: values.activityType,
            description: values.description,
            newFiles: localFiles.map((lf) => lf.file),
            removedAttachmentIds: [...removedIds],
            captions,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        {
          tankId,
          tankProcessId: tankProcessId || undefined,
          reportDate: values.reportDate,
          activityType: values.activityType,
          description: values.description,
          files: localFiles.map((lf) => lf.file),
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-130! max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-3 gap-2">
                  {existingAttachments.map((att) => (
                    <div key={att.id} className="space-y-1">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border group bg-muted">
                        <img src={att.attachmentUrl} alt={att.caption ?? ""} className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => removeExisting(att.id)}
                          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                      <Input
                        value={captionMap[att.id] ?? ""}
                        onChange={(e) => setCaptionMap((prev) => ({ ...prev, [att.id]: e.target.value }))}
                        placeholder="Add caption..."
                        className="text-xs h-7 px-2"
                        maxLength={300}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New local files */}
            {localFiles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">New Attachments</p>
                <div className="grid grid-cols-3 gap-2">
                  {localFiles.map((lf) => (
                    <div key={lf.previewUrl} className="space-y-1">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border group bg-muted">
                        <img src={lf.previewUrl} alt={lf.file.name} className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => removeLocal(lf.previewUrl)}
                          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate" title={lf.file.name}>{lf.file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dropzone */}
            {totalCount < MAX_ATTACHMENTS && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Photo Attachments ({totalCount}/{MAX_ATTACHMENTS})
                </p>
                <ImageDropzone onDrop={handleDrop} maxFiles={MAX_ATTACHMENTS} currentCount={totalCount} />
                {fileError && <p className="text-xs text-destructive mt-1">{fileError}</p>}
              </div>
            )}
            {totalCount >= MAX_ATTACHMENTS && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <ImageIcon className="size-4 shrink-0" />
                Maximum {MAX_ATTACHMENTS} attachments reached.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
