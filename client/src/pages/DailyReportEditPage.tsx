// src/pages/DailyReportEditPage.tsx
import { useCallback, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, X, GripVertical, ImageIcon, Plus, Loader2 } from "lucide-react";
import RichTextEditor, { type RichTextEditorHandle } from "@/components/fields/RichTextEditor";
import { ACTIVITY_OPTIONS } from "@/features/daily-reports/daily-report.constants";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { useDailyReport, useUpdateDailyReport } from "@/features/daily-reports/daily-reports.query";
import type { DailyReportAttachment } from "@/features/daily-reports/daily-reports.api";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

const schema = z.object({
  reportDate: z.string().min(1, "Report date required"),
  activityType: z.enum(["MONITORING", "INSPECTION"]),
  title: z.string().trim().min(1, "Judul kegiatan wajib diisi").max(300),
});

type FormValues = z.infer<typeof schema>;
type DailyReport = NonNullable<ReturnType<typeof useDailyReport>["data"]>;

const MAX_ATTACHMENTS = 20;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface LocalFile {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

interface SortableAttachment extends DailyReportAttachment {
  caption: string;
}

function getInitialAttachments(report: DailyReport): SortableAttachment[] {
  return [...report.attachments]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => ({
      ...a,
      caption: a.caption ?? "",
    }));
}

// ── Sortable photo card existing ─────────────────────────────────────────

interface SortableExistingCardProps {
  attachment: SortableAttachment;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
}

function SortableExistingCard({ attachment, onRemove, onCaptionChange }: SortableExistingCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attachment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col rounded-lg border bg-card overflow-hidden shadow-sm">
      <div className="relative aspect-video bg-muted group">
        <img src={attachment.attachmentUrl} alt="" className="h-full w-full object-cover" loading="lazy" />

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 rounded bg-black/40 text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button type="button" onClick={() => onRemove(attachment.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500" title="Remove photo">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3">
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Caption</label>

        <textarea
          value={attachment.caption}
          onChange={(e) => onCaptionChange(attachment.id, e.target.value)}
          placeholder="Deskripsi singkat foto ini..."
          rows={2}
          maxLength={300}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        />

        <p className="text-right text-[10px] text-muted-foreground mt-1">{attachment.caption.length}/300</p>
      </div>
    </div>
  );
}

// ── New file card ───────────────────────────────────────────────────────────

interface NewFileCardProps {
  localFile: LocalFile;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
}

function NewFileCard({ localFile, onRemove, onCaptionChange }: NewFileCardProps) {
  return (
    <div className="flex flex-col rounded-lg border bg-card overflow-hidden shadow-sm">
      <div className="relative aspect-video bg-muted group">
        <img src={localFile.previewUrl} alt="" className="h-full w-full object-cover" />

        <button type="button" onClick={() => onRemove(localFile.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500" title="Remove photo">
          <X className="h-3.5 w-3.5" />
        </button>

        <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">New</span>
      </div>

      <div className="p-3">
        <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Caption</label>

        <textarea
          value={localFile.caption}
          onChange={(e) => onCaptionChange(localFile.id, e.target.value)}
          placeholder="Deskripsi singkat foto ini..."
          rows={2}
          maxLength={300}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        />

        <p className="text-right text-[10px] text-muted-foreground mt-1">{localFile.caption.length}/300</p>
      </div>
    </div>
  );
}

// ── Page loader ─────────────────────────────────────────────────────────────

export default function DailyReportEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, isError, refetch } = useDailyReport(id!);

  if (isLoading) return <LoadingState />;

  if (isError || !report) {
    return <ErrorState message="Failed to load daily report." onRetry={() => refetch()} />;
  }

  return <DailyReportEditContent key={report.id} report={report} reportId={id!} />;
}

// ── Main edit content ───────────────────────────────────────────────────────

function DailyReportEditContent({ report, reportId }: { report: DailyReport; reportId: string }) {
  const navigate = useNavigate();
  const updateMutation = useUpdateDailyReport();

  const [attachments, setAttachments] = useState<SortableAttachment[]>(() => getInitialAttachments(report));
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<RichTextEditorHandle>(null);
  const recRef = useRef<RichTextEditorHandle>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reportDate: format(new Date(report.reportDate), "yyyy-MM-dd"),
      activityType: report.activityType,
      title: report.title ?? "",
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setAttachments((prev) => {
      const oldIdx = prev.findIndex((a) => a.id === active.id);
      const newIdx = prev.findIndex((a) => a.id === over.id);

      if (oldIdx === -1 || newIdx === -1) return prev;

      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function handleRemoveExisting(attachmentId: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    setRemovedIds((prev) => [...prev, attachmentId]);
  }

  function handleCaptionChange(attachmentId: string, caption: string) {
    setAttachments((prev) => prev.map((a) => (a.id === attachmentId ? { ...a, caption } : a)));
  }

  function handleRemoveLocal(localId: string) {
    setLocalFiles((prev) => {
      const f = prev.find((lf) => lf.id === localId);

      if (f) {
        URL.revokeObjectURL(f.previewUrl);
      }

      return prev.filter((lf) => lf.id !== localId);
    });
  }

  function handleLocalCaptionChange(localId: string, caption: string) {
    setLocalFiles((prev) => prev.map((lf) => (lf.id === localId ? { ...lf, caption } : lf)));
  }

  const handleFileDrop = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const valid = files.filter((f) => ALLOWED_TYPES.has(f.type) && f.size <= MAX_FILE_SIZE);

      const currentTotal = attachments.length + localFiles.length;
      const remainingSlots = MAX_ATTACHMENTS - currentTotal;
      const take = Math.min(valid.length, remainingSlots);

      const newFiles: LocalFile[] = valid.slice(0, take).map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        caption: "",
      }));

      setLocalFiles((prev) => [...prev, ...newFiles]);

      if (valid.length > remainingSlots) {
        alert(`Maximum ${MAX_ATTACHMENTS} photos per report.`);
      }

      e.target.value = "";
    },
    [attachments.length, localFiles.length],
  );

  function submitDailyReport(values: FormValues) {
    const description = descRef.current?.getHTML() ?? "";

    if (descRef.current?.isEmpty()) {
      descRef.current?.focus();
      return;
    }

    const recommendation = recRef.current?.isEmpty() ? null : recRef.current?.getHTML();

    const sortOrders = attachments.map((a, idx) => ({
      attachmentId: a.id,
      sortOrder: idx,
    }));

    const captions = attachments
      .filter((a) => !removedIds.includes(a.id))
      .map((a) => ({
        attachmentId: a.id,
        caption: a.caption,
      }));

    updateMutation.mutate(
      {
        id: reportId,
        data: {
          reportDate: values.reportDate,
          activityType: values.activityType,
          title: values.title.trim(),
          description,
          recommendation,
          removedAttachmentIds: removedIds,
          captions,
          sortOrders,
          newFiles: localFiles.map((lf) => lf.file),
        },
      },
      {
        onSuccess: () => {
          navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", reportId));
        },
      },
    );
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    void form.handleSubmit(submitDailyReport)(event);
  }

  const totalPhotos = attachments.length + localFiles.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", reportId))} type="button">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div>
          <h1 className="text-lg font-semibold">Edit Daily Report</h1>
          <p className="text-xs text-muted-foreground">
            {report.tank?.tankNo ?? "Kegiatan Umum"} — {format(new Date(report.reportDate), "dd MMM yyyy")}
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Basic fields */}
        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="text-sm font-medium">Report Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField control={form.control} name="activityType" label="Activity Type" options={ACTIVITY_OPTIONS} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-medium">
              Judul Kegiatan / Activity Title <span className="text-destructive">*</span>
            </Label>
            <Input id="title" placeholder="cth. Inspeksi visual hasil lasan" maxLength={300} {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>
        </div>

        {/* Description rich editor */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Uraian Kegiatan / Activity Description <span className="text-destructive">*</span>
          </Label>

          <RichTextEditor ref={descRef} initialContent={report.description ?? ""} placeholder="Uraian kegiatan inspeksi harian..." />
        </div>

        {/* Recommendation rich editor */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Rekomendasi / Recommendation <span className="text-muted-foreground font-normal">(opsional)</span>
          </Label>

          <RichTextEditor ref={recRef} initialContent={report.recommendation ?? ""} placeholder="Rekomendasi tindak lanjut (opsional)..." />
        </div>

        {/* Photos drag to reorder */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Photos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder · {totalPhotos}/{MAX_ATTACHMENTS}</p>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={totalPhotos >= MAX_ATTACHMENTS}>
              <Plus className="h-4 w-4 mr-1" /> Add Photos
            </Button>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileDrop} />
          </div>

          {totalPhotos === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg py-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">Click to add photos</span>
              <span className="text-xs">JPEG, PNG, WebP — max 8 MB each</span>
            </button>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={attachments.map((a) => a.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((a) => (
                    <SortableExistingCard key={a.id} attachment={a} onRemove={handleRemoveExisting} onCaptionChange={handleCaptionChange} />
                  ))}

                  {localFiles.map((lf) => (
                    <NewFileCard key={lf.id} localFile={lf} onRemove={handleRemoveLocal} onCaptionChange={handleLocalCaptionChange} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", reportId))} disabled={updateMutation.isPending}>
            Cancel
          </Button>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
