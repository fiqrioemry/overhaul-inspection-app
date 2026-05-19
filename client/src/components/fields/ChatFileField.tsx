/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CHAT_LIMITS } from "@/constants/chats.constant";
import type { MessageType } from "@/schemas/chats.schema";
import { Paperclip, X, FileText, Music, Video } from "lucide-react";

interface ChatFileFieldProps {
  onFileSelect: (file: File, type: MessageType) => void;
  onClear: () => void;
  selectedFile: File | null;
  disabled?: boolean;
}

function getFileType(file: File): MessageType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "file";
  return "file";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreview({ file }: { file: File }) {
  const type = getFileType(file);
  const url = URL.createObjectURL(file);

  if (type === "image") {
    return <img src={url} alt={file.name} className="h-16 w-16 rounded-md object-cover" onLoad={() => URL.revokeObjectURL(url)} />;
  }

  const Icon = type === "audio" ? Music : type === "file" && file.type.includes("video") ? Video : FileText;

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
      <Icon size={24} className="text-muted-foreground" />
    </div>
  );
}

export function ChatFileField({ onFileSelect, onClear, selectedFile, disabled = false }: ChatFileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > CHAT_LIMITS.MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 5MB");
      return;
    }

    if (!CHAT_LIMITS.ALLOWED_FILE_TYPES.includes(file.type as any)) {
      setError("Format file tidak didukung");
      return;
    }

    const type = getFileType(file);
    onFileSelect(file, type);

    // reset input value so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Preview bar */}
      {selectedFile && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-2">
          <FilePreview file={selectedFile} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => {
              onClear();
              setError(null);
            }}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Error */}
      {error && <p className="px-1 text-xs text-destructive">{error}</p>}

      {/* Hidden input + trigger button (rendered outside, icon in ChatInput) */}
      <input
        ref={inputRef}
        type="file"
        accept={Array.isArray(CHAT_LIMITS.ALLOWED_EXTENSIONS) ? CHAT_LIMITS.ALLOWED_EXTENSIONS.map((ext) => (ext.startsWith(".") ? ext : `.${ext}`)).join(",") : CHAT_LIMITS.ALLOWED_EXTENSIONS}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {/* Expose trigger via a forwarded button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground", disabled && "opacity-50 cursor-not-allowed")}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title="Lampirkan file"
      >
        <Paperclip size={18} />
      </Button>
    </div>
  );
}
