import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePlus, UploadCloud } from "lucide-react";
import { useDropzone, type FileRejection } from "react-dropzone";

interface ImageDropzoneProps {
  onDrop: (files: File[]) => void;
  maxSize?: number;
  disabled?: boolean;
  maxFiles?: number;
  currentCount?: number;
}

const ACCEPTED = { "image/jpeg": [], "image/png": [], "image/webp": [] };
const MAX_SIZE = 2 * 1024 * 1024;

export function ImageDropzone({ onDrop, disabled, maxSize = MAX_SIZE, maxFiles = 10, currentCount = 0 }: ImageDropzoneProps) {
  const remaining = maxFiles - currentCount;

  function handleRejected(rejections: FileRejection[]) {
    for (const { file, errors } of rejections) {
      for (const err of errors) {
        if (err.code === "file-too-large") {
          const sizeMB = (file.size / 1024 / 1024).toFixed(1);
          toast.error(`${file.name}: File size ${sizeMB}MB exceeds the ${maxSize / (1024 * 1024)}MB limit.`);
        } else if (err.code === "file-invalid-type") {
          toast.error(`${file.name}: Unsupported format. Use JPEG, PNG, or WebP.`);
        } else if (err.code === "too-many-files") {
          toast.warning(`Only ${remaining} slots remaining.`);
        } else {
          toast.error(`${file.name}: ${err.message}`);
        }
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: handleRejected,
    accept: ACCEPTED,
    maxFiles: remaining,
    maxSize: maxSize,
    disabled: disabled || remaining <= 0,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer select-none",
        isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
        (disabled || remaining <= 0) && "opacity-50 cursor-not-allowed pointer-events-none",
      )}
    >
      <input {...getInputProps()} />
      <div className={cn("flex size-14 items-center justify-center rounded-2xl bg-primary/10 transition-transform", isDragActive && "scale-110")}>
        {isDragActive ? <UploadCloud className="size-7 text-primary" /> : <ImagePlus className="size-7 text-primary" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{isDragActive ? "Lepaskan file di sini" : "Drag & drop gambar, atau klik untuk pilih"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP · Maks. {maxSize / (1024 * 1024)}MB per file · {remaining} slot tersisa
        </p>
      </div>
    </div>
  );
}
