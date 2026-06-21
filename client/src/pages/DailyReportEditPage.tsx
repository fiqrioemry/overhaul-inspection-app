// src/pages/DailyReportEditPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, X, GripVertical, ImageIcon, Plus, Loader2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SelectField from "@/components/fields/SelectField";
import DateField from "@/components/fields/DateField";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { useDailyReport, useUpdateDailyReport } from "@/features/daily-reports/daily-reports.query";
import type { DailyReportAttachment } from "@/features/daily-reports/daily-reports.api";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const schema = z.object({
  reportDate: z.string().min(1, "Report date required"),
  activityType: z.enum(["MONITORING", "INSPECTION"]),
});

type FormValues = z.infer<typeof schema>;

const ACTIVITY_OPTIONS = [
  { label: "Monitoring", value: "MONITORING" },
  { label: "Inspection", value: "INSPECTION" },
];

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

// ── Sortable photo card (existing) ─────────────────────────────────────────

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
        <button
          type="button"
          onClick={() => onRemove(attachment.id)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          title="Remove photo"
        >
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
        <button
          type="button"
          onClick={() => onRemove(localFile.id)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          title="Remove photo"
        >
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

// ── TipTap Toolbar ──────────────────────────────────────────────────────────

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 border-b px-3 py-2 bg-muted/30">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn("px-2 py-1 rounded text-xs font-bold", editor.isActive("bold") ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      >B</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn("px-2 py-1 rounded text-xs italic", editor.isActive("italic") ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      >I</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("px-2 py-1 rounded text-xs", editor.isActive("bulletList") ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        title="Bullet list"
      >• List</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("px-2 py-1 rounded text-xs", editor.isActive("orderedList") ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        title="Numbered list"
      >1. List</button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={cn("px-2 py-1 rounded text-xs", editor.isActive("paragraph") && !editor.isActive("heading") ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      >¶ Normal</button>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function DailyReportEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateMutation = useUpdateDailyReport();

  const { data: report, isLoading, isError, refetch } = useDailyReport(id!);

  const [attachments, setAttachments] = useState<SortableAttachment[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [initialized, setInitialized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reportDate: format(new Date(), "yyyy-MM-dd"), activityType: "MONITORING" },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Uraian kegiatan inspeksi harian..." }),
    ],
    content: "",
    editorProps: {
      attributes: { class: "min-h-40 px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none" },
    },
  });

  // Initialize form + editor once report loads
  useEffect(() => {
    if (!report || initialized) return;
    form.reset({
      reportDate: format(new Date(report.reportDate), "yyyy-MM-dd"),
      activityType: report.activityType,
    });
    if (editor && report.description) {
      editor.commands.setContent(report.description);
    }
    const sorted = [...report.attachments].sort((a, b) => a.sortOrder - b.sortOrder);
    setAttachments(sorted.map((a) => ({ ...a, caption: a.caption ?? "" })));
    setInitialized(true);
  }, [report, editor, initialized, form]);

  // dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setAttachments((prev) => {
      const oldIdx = prev.findIndex((a) => a.id === active.id);
      const newIdx = prev.findIndex((a) => a.id === over.id);
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
      if (f) URL.revokeObjectURL(f.previewUrl);
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
      const total = attachments.length + localFiles.length + valid.length;
      const take = Math.min(valid.length, 15 - (attachments.length + localFiles.length));
      const newFiles: LocalFile[] = valid.slice(0, take).map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        caption: "",
      }));
      setLocalFiles((prev) => [...prev, ...newFiles]);
      if (total > 15) alert("Maximum 15 photos per report.");
      e.target.value = "";
    },
    [attachments.length, localFiles.length],
  );

  function onSubmit(values: FormValues) {
    const description = editor?.getHTML() ?? "";
    if (!description || description === "<p></p>") {
      editor?.commands.focus();
      return;
    }

    // Build sortOrders from current attachment order
    const sortOrders = attachments.map((a, idx) => ({ attachmentId: a.id, sortOrder: idx }));
    const captions = attachments
      .filter((a) => !removedIds.includes(a.id))
      .map((a) => ({ attachmentId: a.id, caption: a.caption }));

    updateMutation.mutate(
      {
        id: id!,
        data: {
          reportDate: values.reportDate,
          activityType: values.activityType,
          description,
          removedAttachmentIds: removedIds,
          captions,
          sortOrders,
          newFiles: localFiles.map((lf) => lf.file),
        },
      },
      {
        onSuccess: () => {
          navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", id!));
        },
      },
    );
  }

  if (isLoading) return <LoadingState />;
  if (isError || !report) return <ErrorState message="Failed to load daily report." onRetry={() => refetch()} />;

  const totalPhotos = attachments.length + localFiles.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", id!))}
          type="button"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Edit Daily Report</h1>
          <p className="text-xs text-muted-foreground">
            {report.tank?.tankNo ?? "Kegiatan Umum"} — {format(new Date(report.reportDate), "dd MMM yyyy")}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic fields */}
        <div className="rounded-lg border p-5 space-y-4">
          <h2 className="text-sm font-medium">Report Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="reportDate" label="Report Date" />
            <SelectField control={form.control} name="activityType" label="Activity Type" options={ACTIVITY_OPTIONS} />
          </div>
        </div>

        {/* Description — TipTap */}
        <div className="rounded-lg border overflow-hidden space-y-0">
          <div className="px-5 pt-4 pb-2">
            <Label className="text-sm font-medium">Uraian Kegiatan / Activity Description</Label>
          </div>
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
          <div className="px-3 pb-2 text-xs text-muted-foreground text-right">
            Rich text — supports bold, italic, bullet lists
          </div>
        </div>

        {/* Photos — drag to reorder */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Photos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder · {totalPhotos}/15</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalPhotos >= 15}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileDrop}
            />
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
                    <SortableExistingCard
                      key={a.id}
                      attachment={a}
                      onRemove={handleRemoveExisting}
                      onCaptionChange={handleCaptionChange}
                    />
                  ))}
                  {localFiles.map((lf) => (
                    <NewFileCard
                      key={lf.id}
                      localFile={lf}
                      onRemove={handleRemoveLocal}
                      onCaptionChange={handleLocalCaptionChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.DAILY_REPORT_DETAIL.replace(":id", id!))}
            disabled={updateMutation.isPending}
          >
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
