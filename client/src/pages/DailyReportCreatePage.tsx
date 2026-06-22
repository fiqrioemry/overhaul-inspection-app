// src/pages/DailyReportCreatePage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, X, Sparkles, Loader2, CheckCircle2, AlertTriangle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import { ImageDropzone } from "@/components/fields/ImageDropzone";
import RichTextEditor, { type RichTextEditorHandle } from "@/components/fields/RichTextEditor";
import { useCreateDailyReport, useGenerateAIDailyReport, useTankOptions, useTankProcessOptions } from "@/features/daily-reports/daily-reports.query";
import { ACTIVITY_OPTIONS } from "@/features/daily-reports/daily-report.constants";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const schema = z.object({
  reportDate: z.string().min(1, "Report date required"),
  activityType: z.enum(["MONITORING", "INSPECTION"]),
  tankId: z.string().optional(),
  tankProcessId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const NO_TANK_VALUE = "__none__";
const NO_PROCESS_VALUE = "__none__";
const MAX_ATTACHMENTS = 15;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const AI_STEPS = ["Menganalisis foto...", "Memahami konteks inspeksi...", "Menyusun uraian kegiatan...", "Menyusun rekomendasi..."];

interface LocalFile {
  file: File;
  previewUrl: string;
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function DailyReportCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lockedTankId = searchParams.get("tankId") ?? undefined;
  const lockedProcessId = searchParams.get("tankProcessId") ?? undefined;
  const selectable = !lockedTankId;

  const createMutation = useCreateDailyReport();
  const generateAI = useGenerateAIDailyReport();

  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [localCaptions, setLocalCaptions] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [recommendationHtml, setRecommendationHtml] = useState("");
  const [descError, setDescError] = useState(false);

  // AI state
  const [aiStep, setAiStep] = useState(0);
  const [aiWarning, setAiWarning] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [pendingAi, setPendingAi] = useState<{ description: string; recommendation: string | null } | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const descRef = useRef<RichTextEditorHandle>(null);
  const recRef = useRef<RichTextEditorHandle>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      reportDate: format(new Date(), "yyyy-MM-dd"),
      activityType: "MONITORING",
      tankId: lockedProcessId ? "" : "",
      tankProcessId: "",
    },
  });

  const selectedTankValue = form.watch("tankId") ?? "";
  const selectedProcessValue = form.watch("tankProcessId") ?? "";
  const effectiveTankId = selectable
    ? selectedTankValue && selectedTankValue !== NO_TANK_VALUE
      ? selectedTankValue
      : undefined
    : lockedTankId;
  const effectiveProcessId = selectable
    ? selectedProcessValue && selectedProcessValue !== NO_PROCESS_VALUE
      ? selectedProcessValue
      : undefined
    : lockedProcessId;

  const { data: tankOptions = [] } = useTankOptions();
  const { data: tankProcessOptions = [] } = useTankProcessOptions(effectiveTankId ?? "");

  const tankSelectOptions = [
    { label: "General — no tank", value: NO_TANK_VALUE },
    ...tankOptions.map((t) => ({ label: t.tankName ? `${t.tankNo} — ${t.tankName}` : t.tankNo, value: t.id })),
  ];
  const processSelectOptions = [
    { label: "No specific process", value: NO_PROCESS_VALUE },
    ...tankProcessOptions.map((p) => ({ label: p.name, value: p.id })),
  ];
  const effectiveProcessName = selectable ? tankProcessOptions.find((p) => p.id === selectedProcessValue)?.name : undefined;

  // Reset process when tank changes
  const prevTankRef = useRef(selectedTankValue);
  useEffect(() => {
    if (prevTankRef.current !== selectedTankValue) {
      prevTankRef.current = selectedTankValue;
      form.setValue("tankProcessId", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTankValue]);

  // Keep captions array in sync with files
  useEffect(() => {
    setLocalCaptions((prev) => {
      if (prev.length === localFiles.length) return prev;
      if (localFiles.length > prev.length) return [...prev, ...Array(localFiles.length - prev.length).fill("")];
      return prev.slice(0, localFiles.length);
    });
  }, [localFiles.length]);

  useEffect(() => {
    return () => localFiles.forEach((lf) => URL.revokeObjectURL(lf.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = localFiles.length;
  const hasNewFiles = localFiles.length > 0;

  const handleDrop = useCallback(
    (files: File[]) => {
      setFileError(null);
      const available = MAX_ATTACHMENTS - totalCount;
      const valid: LocalFile[] = [];
      for (const file of files.slice(0, available)) {
        if (!ALLOWED_TYPES.has(file.type)) {
          setFileError(`"${file.name}" is not a supported image type (jpeg/png/webp).`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`"${file.name}" exceeds 8 MB.`);
          continue;
        }
        valid.push({ file, previewUrl: URL.createObjectURL(file) });
      }
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

  function setLocalCaption(idx: number, value: string) {
    setLocalCaptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  function applyAi(result: { description: string; recommendation: string | null }, mode: "replace" | "append") {
    if (mode === "replace") {
      descRef.current?.setContent(result.description);
      if (result.recommendation) recRef.current?.setContent(result.recommendation);
    } else {
      descRef.current?.appendContent(result.description);
      if (result.recommendation) recRef.current?.appendContent(result.recommendation);
    }
    setPendingAi(null);
  }

  async function handleGenerateAI() {
    if (!hasNewFiles || generateAI.isPending) return;
    setAiWarning(false);
    setAiNotes([]);
    setAiStep(0);
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, AI_STEPS.length - 1);
      setAiStep(step);
    }, 1600);

    try {
      const result = await generateAI.mutateAsync({
        tankId: effectiveTankId,
        activityType: form.getValues("activityType"),
        processName: effectiveProcessName || undefined,
        descriptionDraft: descriptionHtml ? htmlToText(descriptionHtml) : undefined,
        recommendationDraft: recommendationHtml ? htmlToText(recommendationHtml) : undefined,
        files: localFiles.map((lf) => lf.file),
      });
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);

      // Captions from AI
      setLocalCaptions((prev) => prev.map((c, i) => result.captions[i] ?? c ?? ""));
      if (result.relevanceWarning) setAiWarning(true);
      if (result.notes?.length) setAiNotes(result.notes);

      const editorsHaveContent = !(descRef.current?.isEmpty() ?? true) || !(recRef.current?.isEmpty() ?? true);
      if (editorsHaveContent) {
        // Let the user decide whether to replace or append.
        setPendingAi({ description: result.description, recommendation: result.recommendation });
      } else {
        applyAi({ description: result.description, recommendation: result.recommendation }, "replace");
      }
    } catch {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    }
  }

  function onSubmit(values: FormValues) {
    const description = descRef.current?.getHTML() ?? "";
    if (descRef.current?.isEmpty()) {
      setDescError(true);
      descRef.current?.focus();
      return;
    }
    setDescError(false);
    const recommendation = recRef.current?.isEmpty() ? undefined : recRef.current?.getHTML();

    createMutation.mutate(
      {
        tankId: effectiveTankId,
        tankProcessId: effectiveProcessId,
        reportDate: values.reportDate,
        activityType: values.activityType,
        description,
        recommendation,
        files: localFiles.map((lf) => lf.file),
        newFileCaptions: localCaptions,
      },
      { onSuccess: (detail) => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", detail.id)) },
    );
  }

  const isGenerating = generateAI.isPending;
  const hasTankChoice = selectedTankValue !== "";
  const contextLabel = !selectable
    ? "Process context"
    : !hasTankChoice
      ? null
      : !effectiveTankId
        ? "General activity"
        : effectiveProcessId
          ? "Tank + process"
          : "Tank only";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={() => navigate(ROUTES.DAILY_REPORTS)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Create Daily Report</h1>
          <p className="text-xs text-muted-foreground">Dokumentasikan kegiatan inspeksi harian — uraian, rekomendasi, dan foto.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Report details */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Report Details</h2>
            {contextLabel && (
              <span className="inline-flex items-center rounded-full bg-muted border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{contextLabel}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField control={form.control} name="activityType" label="Activity Type" options={ACTIVITY_OPTIONS} />
          </div>

          {selectable && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <span className="text-sm font-medium">Report Context (optional)</span>
              <div className={cn("grid grid-cols-1 gap-4", effectiveTankId && "sm:grid-cols-2")}>
                <SelectField control={form.control} name="tankId" label="Tank" placeholder="Select tank..." options={tankSelectOptions} />
                {effectiveTankId && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <SelectField control={form.control} name="tankProcessId" label="Process" placeholder="Select process..." options={processSelectOptions} />
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
        </div>

        {/* Photo attachments + AI */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Photo Attachments</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{totalCount}/{MAX_ATTACHMENTS} — JPEG, PNG, WebP (max 8 MB each)</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasNewFiles || isGenerating}
              onClick={handleGenerateAI}
              className={cn("h-8 gap-1.5 text-xs", hasNewFiles && !isGenerating && "border-violet-300 text-violet-700 hover:bg-violet-50")}
              title={!hasNewFiles ? "Upload minimal 1 foto untuk menggunakan fitur AI" : "Generate uraian, rekomendasi, dan caption dari foto"}
            >
              {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {isGenerating ? "Generating..." : "Generate dengan AI"}
            </Button>
          </div>

          {totalCount < MAX_ATTACHMENTS && (
            <ImageDropzone onDrop={handleDrop} maxFiles={MAX_ATTACHMENTS} currentCount={totalCount} />
          )}
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}

          {/* AI progress */}
          {isGenerating && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-violet-600 shrink-0" />
                <span className="text-sm font-medium text-violet-700">{AI_STEPS[aiStep]}</span>
              </div>
              <div className="flex gap-1">
                {AI_STEPS.map((_, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i <= aiStep ? "bg-violet-500" : "bg-violet-100")} />
                ))}
              </div>
            </div>
          )}

          {/* Relevance warning */}
          {aiWarning && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <span><strong>Perhatian:</strong> Foto yang diunggah tampaknya tidak berhubungan dengan kegiatan inspeksi tangki. Pastikan foto adalah dokumentasi pekerjaan inspeksi/overhaul untuk hasil AI yang akurat.</span>
            </div>
          )}
          {aiNotes.length > 0 && (
            <ul className="rounded-md border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground list-disc pl-6 space-y-0.5">
              {aiNotes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}

          {/* Replace / Append choice */}
          {pendingAi && (
            <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2.5 space-y-2">
              <p className="text-xs text-violet-800 flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Hasil AI siap. Editor sudah berisi data — pilih cara menerapkan:
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => applyAi(pendingAi, "replace")}>Replace</Button>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => applyAi(pendingAi, "append")}>Append</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setPendingAi(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Photo grid with captions */}
          {localFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {localFiles.map((lf, idx) => (
                <div key={lf.previewUrl} className="space-y-1">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted group">
                    <img src={lf.previewUrl} alt={lf.file.name} className="w-full h-full object-contain" />
                    <button type="button" onClick={() => removeLocal(idx)} className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive">
                      <X className="size-3" />
                    </button>
                  </div>
                  <Input value={localCaptions[idx] ?? ""} onChange={(e) => setLocalCaption(idx, e.target.value)} placeholder="Add caption..." className="text-xs h-7 px-2" maxLength={300} />
                </div>
              ))}
            </div>
          )}

          {!hasNewFiles && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-violet-200 bg-violet-50/50 px-3 py-2 text-[11px] text-violet-600">
              <Sparkles className="size-3.5 shrink-0" /> Upload foto untuk mengaktifkan fitur Generate dengan AI.
            </div>
          )}
          {totalCount >= MAX_ATTACHMENTS && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <ImageIcon className="size-4 shrink-0" /> Maximum {MAX_ATTACHMENTS} attachments reached.
            </div>
          )}
        </div>

        {/* Description (rich editor) */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Uraian Kegiatan / Activity Description <span className="text-destructive">*</span></Label>
          <RichTextEditor ref={descRef} placeholder="Uraian kegiatan inspeksi harian..." onChange={setDescriptionHtml} />
          {descError && <p className="text-xs text-destructive">Uraian kegiatan wajib diisi.</p>}
        </div>

        {/* Recommendation (rich editor) */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Rekomendasi / Recommendation <span className="text-muted-foreground font-normal">(opsional)</span></Label>
          <RichTextEditor ref={recRef} placeholder="Rekomendasi tindak lanjut (opsional)..." onChange={setRecommendationHtml} />
        </div>

        {/* AI generated indicator */}
        {generateAI.isSuccess && !isGenerating && !pendingAi && !aiWarning && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700">
            <CheckCircle2 className="size-3.5 shrink-0" /> Uraian, rekomendasi, dan caption berhasil dibuat AI. Silakan periksa dan edit sesuai kebutuhan.
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.DAILY_REPORTS)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Create Report
          </Button>
        </div>
      </form>
    </div>
  );
}
