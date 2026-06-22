// src/features/tanks/components/TankDocumentSection.tsx
import { useCallback, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { FileText, FileSpreadsheet, ImageIcon, Sparkles, Loader2, X, CheckCircle2, AlertTriangle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExtractTankDocument } from "../tanks.query";
import type { TankExtractResult } from "../tanks.api";

const ACCEPTED = {
  "application/pdf": [],
  "application/msword": [],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
  "application/vnd.ms-excel": [],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
};

const MAX_FILES = 10;
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
// Only these can be read by the AI OCR model.
const EXTRACTABLE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const AI_STEPS = ["Membaca dokumen...", "Menjalankan OCR...", "Mengekstrak spesifikasi tangki...", "Menyusun data formulir..."];

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="size-4 text-blue-500 shrink-0" />;
  if (type.includes("spreadsheet") || type.includes("excel")) return <FileSpreadsheet className="size-4 text-green-600 shrink-0" />;
  return <FileText className="size-4 text-red-500 shrink-0" />;
}

interface TankDocumentSectionProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onApplyExtraction: (result: TankExtractResult) => void;
}

export default function TankDocumentSection({ files, onFilesChange, onApplyExtraction }: TankDocumentSectionProps) {
  const extract = useExtractTankDocument();
  const [aiStep, setAiStep] = useState(0);
  const [aiDone, setAiDone] = useState(false);
  const [aiWarning, setAiWarning] = useState(false);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isExtracting = extract.isPending;
  const extractableFiles = files.filter((f) => EXTRACTABLE_TYPES.has(f.type));
  const canExtract = extractableFiles.length > 0 && !isExtracting;

  const handleRejected = useCallback((rejections: FileRejection[]) => {
    for (const { file, errors } of rejections) {
      for (const err of errors) {
        if (err.code === "file-too-large") toast.error(`${file.name}: melebihi batas 15MB.`);
        else if (err.code === "file-invalid-type") toast.error(`${file.name}: format tidak didukung (PDF, Word, Excel, gambar).`);
        else if (err.code === "too-many-files") toast.warning(`Maksimal ${MAX_FILES} dokumen.`);
        else toast.error(`${file.name}: ${err.message}`);
      }
    }
  }, []);

  const handleDrop = useCallback(
    (accepted: File[]) => {
      const available = MAX_FILES - files.length;
      const toAdd = accepted.slice(0, available);
      if (toAdd.length > 0) onFilesChange([...files, ...toAdd]);
    },
    [files, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDropRejected: handleRejected,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES - files.length,
    disabled: files.length >= MAX_FILES,
  });

  function removeFile(idx: number) {
    onFilesChange(files.filter((_, i) => i !== idx));
  }

  async function handleExtract() {
    if (!canExtract) return;
    setAiWarning(false);
    setAiDone(false);
    setAiStep(0);

    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, AI_STEPS.length - 1);
      setAiStep(step);
    }, 1500);

    try {
      const result = await extract.mutateAsync(extractableFiles);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setAiStep(AI_STEPS.length - 1);
      onApplyExtraction(result);
      setAiDone(true);
      if (result.relevanceWarning) setAiWarning(true);
    } catch {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">Dokumen Spesifikasi & AI OCR</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canExtract}
          onClick={handleExtract}
          className={cn("h-7 gap-1.5 text-xs transition-all", canExtract && "border-violet-300 text-violet-700 hover:bg-violet-100")}
          title={extractableFiles.length === 0 ? "Unggah PDF atau gambar untuk mengekstrak data otomatis" : "Ekstrak data spesifikasi dari dokumen"}
        >
          {isExtracting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {isExtracting ? "Mengekstrak..." : "Ekstrak dengan AI"}
        </Button>
      </div>

      <p className="text-[11px] text-violet-600/80">Unggah datasheet/spesifikasi tangki (PDF, Word, Excel, atau gambar). PDF & gambar dapat diekstrak otomatis untuk mengisi formulir.</p>

      {/* Dropzone */}
      {files.length < MAX_FILES && (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all select-none",
            isDragActive ? "border-violet-400 bg-violet-100/60" : "border-violet-200 bg-white/60 hover:border-violet-300",
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className={cn("size-6 text-violet-500 transition-transform", isDragActive && "scale-110")} />
          <p className="text-xs font-medium text-violet-700">{isDragActive ? "Lepaskan dokumen di sini" : "Seret & lepas dokumen, atau klik untuk memilih"}</p>
          <p className="text-[10px] text-violet-500">PDF, Word, Excel, JPG, PNG · Maks. 15MB · {MAX_FILES - files.length} slot tersisa</p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, idx) => {
            const extractable = EXTRACTABLE_TYPES.has(file.type);
            return (
              <li key={`${file.name}-${idx}`} className="flex items-center gap-2 rounded-md border border-violet-100 bg-white px-2.5 py-1.5">
                {fileIcon(file.type)}
                <span className="flex-1 truncate text-xs text-foreground">{file.name}</span>
                {!extractable && (
                  <span className="text-[10px] text-muted-foreground" title="Tipe ini hanya disimpan, tidak diekstrak AI">
                    simpan saja
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                <button type="button" onClick={() => removeFile(idx)} className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <X className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* AI progress */}
      {isExtracting && (
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
          <p className="text-[11px] text-violet-500">AI sedang membaca dokumen dan mengekstrak data spesifikasi tangki...</p>
        </div>
      )}

      {/* Success */}
      {aiDone && !isExtracting && !aiWarning && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700">
          <CheckCircle2 className="size-3.5 shrink-0" />
          Data berhasil diekstrak dan diisi ke formulir. Silakan periksa dan koreksi bila perlu.
        </div>
      )}

      {/* Relevance warning */}
      {aiWarning && !isExtracting && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Perhatian:</strong> Dokumen yang diunggah tampaknya bukan spesifikasi tangki. Periksa kembali isian formulir karena hasil ekstraksi mungkin tidak akurat.
          </span>
        </div>
      )}
    </div>
  );
}
