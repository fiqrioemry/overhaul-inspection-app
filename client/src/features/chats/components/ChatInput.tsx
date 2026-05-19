// src/features/chats/components/ChatInput.tsx
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_LIMITS } from "@/constants/chats.constant";
import type { MessageType } from "@/schemas/chats.schema";
import { useSendMessage } from "@/features/chats/chats.query";
import { Send, Paperclip, X, FileText, Music, ImageIcon, Loader2 } from "lucide-react";

interface ChatInputProps {
  chatId: string;
}

function getFileType(file: File): MessageType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatInput({ chatId }: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<MessageType>("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: sendMessage, isPending } = useSendMessage(chatId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > CHAT_LIMITS.MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const allowed = CHAT_LIMITS.ALLOWED_FILE_TYPES as readonly string[];
    if (!allowed.includes(file.type)) {
      toast.error("Format file tidak didukung");
      return;
    }

    setSelectedFile(file);
    setFileType(getFileType(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;
    if (isPending) return;

    sendMessage(
      {
        text: trimmed || (selectedFile?.name ?? ""),
        type: selectedFile ? fileType : "text",
        media: selectedFile ?? undefined,
      },
      {
        onSuccess: () => {
          setText("");
          setSelectedFile(null);
          textareaRef.current?.focus();
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const FileIcon = fileType === "image" ? ImageIcon : fileType === "audio" ? Music : FileText;
  const canSend = (text.trim().length > 0 || selectedFile !== null) && !isPending;

  return (
    <div className="px-4 py-3 border-t border-border bg-background/95 backdrop-blur-sm shrink-0">
      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-muted/60 border border-border">
          {fileType === "image" ? (
            <img src={URL.createObjectURL(selectedFile)} alt={selectedFile.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileIcon size={20} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selectedFile.name}</p>
            <p className="text-[11px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setSelectedFile(null)}>
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* File attachment */}
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
          <Paperclip size={18} />
        </Button>
        <input ref={fileInputRef} type="file" accept={CHAT_LIMITS.ALLOWED_EXTENSIONS.join(",")} className="hidden" onChange={handleFileChange} disabled={isPending} />

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            rows={1}
            disabled={isPending}
            className="resize-none min-h-9 max-h-[120px] py-2 px-3 text-sm rounded-2xl bg-muted/60 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 scrollbar-none"
            style={{ height: "36px" }}
          />
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className={cn("h-9 w-9 shrink-0 rounded-xl transition-all", canSend ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground")}
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  );
}
