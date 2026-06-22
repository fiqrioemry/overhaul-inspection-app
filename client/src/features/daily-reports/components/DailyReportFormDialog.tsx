// src/features/daily-reports/components/DailyReportFormDialog.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { X, ImageIcon, Sparkles, Loader2, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LongTextField from "@/components/fields/LongTextField";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { ImageDropzone } from "@/components/fields/ImageDropzone";
import { useCreateDailyReport, useUpdateDailyReport, useDailyReport, useGenerateAIDailyReport, useTankOptions, useTankProcessOptions } from "../daily-reports.query";
import { format } from "date-fns";
import type { DailyReportSummary, DailyReportAttachment } from "../daily-reports.api";
import { cn } from "@/lib/utils";

const schema = z.object({
  reportDate: z.string().min(1, "Report date required"),
  activityType: z.enum(["MONITORING", "INSPECTION"]),
  description: z.string().min(1, "Description required").max(2000),
  tankId: z.string().optional(),
  tankProcessId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const NO_TANK_VALUE = "__none__";
const NO_PROCESS_VALUE = "__none__";

export const ACTIVITY_OPTIONS = [
  { label: "Monitoring", value: "MONITORING" },
  { label: "Inspection", value: "INSPECTION" },
];

export const ACTIVITY_LABEL: Record<string, string> = {
  MONITORING: "Monitoring",
  INSPECTION: "Inspection",
};

const MAX_ATTACHMENTS = 15;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const AI_STEPS = [
  "Menganalisis foto...",
  "Memahami konteks inspeksi...",
  "Membuat uraian kegiatan...",
  "Membuat caption foto...",
];

interface LocalFile {
  file: File;
  previewUrl: string;
}

interface DailyReportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the report is fixed to this tank and the tank/process selectors are hidden. */
  tankId?: string;
  tankProcessId?: string;
  processName?: string;
  report?: DailyReportSummary;
}

export default function DailyReportFormDialog({
  open,
  onOpenChange,
  tankId,
  tankProcessId,
  processName,
  report,
}: DailyReportFormDialogProps) {
  const isEdit = Boolean(report);
  // Selectable mode: no fixed tank from the page context (e.g. /daily-reports).
  const selectable = !isEdit && !tankId;
  const createMutation = useCreateDailyReport();
  const updateMutation = useUpdateDailyReport();
  const generateAI = useGenerateAIDailyReport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: detail } = useDailyReport(report?.id ?? "");

  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [localCaptions, setLocalCaptions] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [captionMap, setCaptionMap] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);

  // AI state
  const [aiStep, setAiStep] = useState(0);
  const [aiHighlight, setAiHighlight] = useState(false);
  const [aiWarning, setAiWarning] = useState(false);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const existingAttachments: DailyReportAttachment[] = (detail?.attachments ?? []).filter(
    (a) => !removedIds.has(a.id),
  );
  const totalCount = existingAttachments.length + localFiles.length;
  const hasNewFiles = localFiles.length > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "MONITORING", description: "", tankId: "", tankProcessId: "" },
  });

  // Tank/process selectors (only used in selectable mode)
  const selectedTankValue = form.watch("tankId") ?? "";
  const selectedProcessValue = form.watch("tankProcessId") ?? "";
  // Effective tank id resolves the "general" sentinel to undefined.
  const effectiveTankId = selectable
    ? selectedTankValue && selectedTankValue !== NO_TANK_VALUE
      ? selectedTankValue
      : undefined
    : tankId;
  const { data: tankOptions = [] } = useTankOptions();
  const { data: tankProcessOptions = [] } = useTankProcessOptions(selectable ? effectiveTankId ?? "" : "");

  const tankSelectOptions = [
    { label: "General — no tank", value: NO_TANK_VALUE },
    ...tankOptions.map((t) => ({ label: t.tankName ? `${t.tankNo} — ${t.tankName}` : t.tankNo, value: t.id })),
  ];
  const processSelectOptions = [
    { label: "No specific process", value: NO_PROCESS_VALUE },
    ...tankProcessOptions.map((p) => ({ label: p.name, value: p.id })),
  ];

  const effectiveTankProcessId = selectable
    ? selectedProcessValue && selectedProcessValue !== NO_PROCESS_VALUE
      ? selectedProcessValue
      : undefined
    : tankProcessId;
  const effectiveProcessName = selectable
    ? tankProcessOptions.find((p) => p.id === selectedProcessValue)?.name
    : processName;

  // Human-readable context badge for the selectable form.
  const hasTankChoice = selectedTankValue !== "";
  const contextLabel = !hasTankChoice
    ? null
    : !effectiveTankId
      ? "General activity"
      : effectiveTankProcessId
        ? "Tank + process"
        : "Tank only";

  // Reset the selected process whenever the tank changes (process belongs to a tank).
  const prevTankRef = useRef(selectedTankValue);
  useEffect(() => {
    if (prevTankRef.current !== selectedTankValue) {
      prevTankRef.current = selectedTankValue;
      form.setValue("tankProcessId", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTankValue]);

  useEffect(() => {
    if (open && report) {
      form.reset({
        reportDate: report.reportDate.slice(0, 10),
        activityType: report.activityType,
        description: report.description ?? "",
        tankId: report.tankId ?? "",
        tankProcessId: report.tankProcessId ?? "",
      });
      if (detail?.attachments) {
        const initial: Record<string, string> = {};
        detail.attachments.forEach((a) => {
          initial[a.id] = a.caption ?? "";
        });
        setCaptionMap(initial);
      }
    } else if (!open) {
      form.reset({ reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "MONITORING", description: "", tankId: "", tankProcessId: "" });
      localFiles.forEach((lf) => URL.revokeObjectURL(lf.previewUrl));
      setLocalFiles([]);
      setLocalCaptions([]);
      setRemovedIds(new Set());
      setCaptionMap({});
      setFileError(null);
      setAiWarning(false);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report]);

  useEffect(() => {
    if (isEdit && detail?.attachments) {
      setCaptionMap((prev) => {
        const next = { ...prev };
        detail.attachments.forEach((a) => {
          if (!(a.id in next)) next[a.id] = a.caption ?? "";
        });
        return next;
      });
    }
  }, [detail, isEdit]);

  // Keep localCaptions in sync when localFiles changes (add/remove)
  useEffect(() => {
    setLocalCaptions((prev) => {
      if (prev.length === localFiles.length) return prev;
      if (localFiles.length > prev.length) return [...prev, ...Array(localFiles.length - prev.length).fill("")];
      return prev.slice(0, localFiles.length);
    });
  }, [localFiles.length]);

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

  function removeLocal(idx: number) {
    setLocalFiles((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
    setLocalCaptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeExisting(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
  }

  function setLocalCaption(idx: number, value: string) {
    setLocalCaptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  async function handleGenerateAI() {
    if (!hasNewFiles) return;
    setAiWarning(false);
    setAiStep(0);

    // Cycle through step labels while waiting
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, AI_STEPS.length - 1);
      setAiStep(step);
    }, 1800);

    try {
      const result = await generateAI.mutateAsync({
        tankId: effectiveTankId,
        activityType: form.getValues("activityType"),
        processName: effectiveProcessName || undefined,
        files: localFiles.map((lf) => lf.file),
      });

      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setAiStep(AI_STEPS.length - 1);

      form.setValue("description", result.description, { shouldDirty: true, shouldValidate: true });
      setLocalCaptions((prev) =>
        prev.map((_, i) => result.captions[i] ?? prev[i] ?? ""),
      );

      if (result.relevanceWarning) setAiWarning(true);

      // Brief highlight flash on description area
      setAiHighlight(true);
      setTimeout(() => setAiHighlight(false), 1600);
    } catch {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    }
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
          tankId: effectiveTankId,
          tankProcessId: effectiveTankProcessId,
          reportDate: values.reportDate,
          activityType: values.activityType,
          description: values.description,
          files: localFiles.map((lf) => lf.file),
          newFileCaptions: localCaptions,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  const isGenerating = generateAI.isPending;
  const generationDone = generateAI.isSuccess && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xl:w-205! max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Daily Report" : "Add Daily Report"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* Tank / process selectors — only when not bound to a page context */}
            {selectable && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Report Context</span>
                  {contextLabel && (
                    <span className="inline-flex items-center rounded-full bg-background border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {contextLabel}
                    </span>
                  )}
                </div>

                <div className={cn("grid grid-cols-1 gap-4", effectiveTankId && "sm:grid-cols-2")}>
                  <SelectField
                    control={form.control}
                    name="tankId"
                    label="Tank"
                    placeholder="Select tank..."
                    options={tankSelectOptions}
                  />

                  {/* Process selector reveals only after a real tank is selected */}
                  {effectiveTankId && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <SelectField
                        control={form.control}
                        name="tankProcessId"
                        label="Process"
                        placeholder="Select process..."
                        options={processSelectOptions}
                      />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {!hasTankChoice
                    ? "Choose a tank, or select “General — no tank” for activity not tied to a specific tank."
                    : !effectiveTankId
                      ? "General report — not linked to any tank or process."
                      : "Optionally narrow this report down to a specific process of the selected tank."}
                </p>
              </div>
            )}

            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField
              control={form.control}
              name="activityType"
              label="Activity Type"
              options={ACTIVITY_OPTIONS}
            />

            {/* Description with AI button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Activity Description
                  {generationDone && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-violet-600 font-normal">
                      <Sparkles className="size-3" /> AI generated
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!hasNewFiles || isGenerating}
                  onClick={handleGenerateAI}
                  className={cn(
                    "h-7 gap-1.5 text-xs transition-all",
                    hasNewFiles && !isGenerating && "border-violet-300 text-violet-700 hover:bg-violet-50",
                  )}
                  title={!hasNewFiles ? "Upload minimal 1 foto baru untuk menggunakan fitur AI" : "Generate uraian dan caption dari foto"}
                >
                  {isGenerating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  {isGenerating ? "Generating..." : "Generate dengan AI"}
                </Button>
              </div>

              {/* AI Generating progress banner */}
              {isGenerating && (
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-violet-600 shrink-0" />
                    <span className="text-sm font-medium text-violet-700">{AI_STEPS[aiStep]}</span>
                  </div>
                  <div className="flex gap-1">
                    {AI_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-500",
                          i <= aiStep ? "bg-violet-500" : "bg-violet-100",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-violet-500">
                    AI sedang menganalisis foto dan membuat uraian kegiatan inspeksi...
                  </p>
                </div>
              )}

              {/* AI success ribbon */}
              {generationDone && !aiWarning && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  Uraian dan caption foto berhasil dibuat. Silakan periksa dan edit sesuai kebutuhan.
                </div>
              )}

              {/* Relevance warning */}
              {aiWarning && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Perhatian:</strong> Foto yang diunggah tampaknya tidak berhubungan dengan kegiatan inspeksi
                    tangki. Pastikan foto yang diunggah adalah dokumentasi pekerjaan inspeksi/overhaul untuk hasil AI
                    yang akurat.
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "rounded-md transition-all duration-700",
                  aiHighlight && "ring-2 ring-violet-400 ring-offset-1",
                )}
              >
                <LongTextField
                  control={form.control}
                  name="description"
                  label=""
                  placeholder="Describe the daily activities..."
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </div>

            {/* Existing attachments (edit mode) */}
            {existingAttachments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Existing Attachments
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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

            {/* New local files with caption inputs */}
            {localFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    New Attachments
                  </p>
                  {generationDone && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-violet-600">
                      <Sparkles className="size-3" /> Caption dibuat AI
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {localFiles.map((lf, idx) => (
                    <div key={lf.previewUrl} className="space-y-1">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border group bg-muted">
                        <img src={lf.previewUrl} alt={lf.file.name} className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => removeLocal(idx)}
                          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="size-3" />
                        </button>
                        {localCaptions[idx] && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1.5 py-0.5">
                            <Sparkles className="size-2.5 text-violet-300 inline mr-0.5" />
                          </div>
                        )}
                      </div>
                      <Input
                        value={localCaptions[idx] ?? ""}
                        onChange={(e) => setLocalCaption(idx, e.target.value)}
                        placeholder="Add caption..."
                        className={cn(
                          "text-xs h-7 px-2 transition-all duration-500",
                          aiHighlight && localCaptions[idx] && "ring-1 ring-violet-400",
                        )}
                        maxLength={300}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hint when no new files */}
            {!hasNewFiles && !isEdit && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-violet-200 bg-violet-50/50 px-3 py-2 text-[11px] text-violet-600">
                <Sparkles className="size-3.5 shrink-0" />
                Upload foto untuk mengaktifkan fitur Generate dengan AI
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

            <div className="flex justify-between gap-2 pt-2">
              {generationDone && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs gap-1"
                  onClick={() => {
                    generateAI.reset();
                    setAiWarning(false);
                  }}
                >
                  <RotateCcw className="size-3" /> Reset AI
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Report"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
