// src/features/chats/components/ChatInput.tsx
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_LIMITS } from "@/constants/chats.constant";
import type { MessageType, ReplyToMessage } from "@/schemas/chats.schema";
import { useSendMessage } from "@/features/chats/chats.query";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { Send, Paperclip, X, FileText, Music, ImageIcon, Loader2, Smile, CornerUpLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
  chatId: string;
  replyTo?: ReplyToMessage | null;
  onCancelReply?: () => void;
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

export default function ChatInput({ chatId, replyTo, onCancelReply }: ChatInputProps) {
  const [text, setText] = useState("");
  const { t } = useTranslation(["chat"]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<MessageType>("file");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const { resolvedTheme } = useTheme();
  const { mutate: sendMessage, isPending } = useSendMessage(chatId);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target) && emojiButtonRef.current && !emojiButtonRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  function handleEmojiClick(emojiData: EmojiClickData) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const newText = text.slice(0, start) + emojiData.emoji + text.slice(end);

    setText(newText);

    requestAnimationFrame(() => {
      const newPos = start + emojiData.emoji.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > CHAT_LIMITS.MAX_FILE_SIZE) {
      toast.error("Maximum file size is 5MB");
      return;
    }

    const allowed = CHAT_LIMITS.ALLOWED_FILE_TYPES as readonly string[];
    if (!allowed.includes(file.type)) {
      toast.error("File format not supported");
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
        replyToId: replyTo?.id,
      },
      {
        onSuccess: () => {
          setText("");
          setSelectedFile(null);
          setShowEmojiPicker(false);
          onCancelReply?.();
          textareaRef.current?.focus();
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.key === "Escape") {
      if (showEmojiPicker) setShowEmojiPicker(false);
      else onCancelReply?.();
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const FileIcon = fileType === "image" ? ImageIcon : fileType === "audio" ? Music : FileText;
  const canSend = (text.trim().length > 0 || selectedFile !== null) && !isPending;

  return (
    <div className="relative px-4 py-3 border-t border-border bg-background/95 backdrop-blur-sm shrink-0">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT} lazyLoadEmojis searchPlaceholder="Cari emoji..." width={300} height={380} />
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-xl bg-muted/60 border border-border border-l-4 border-l-primary">
          <CornerUpLeft size={14} className="text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-primary">{replyTo.sender.name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground" onClick={onCancelReply}>
            <X size={12} />
          </Button>
        </div>
      )}

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
            placeholder={t("chat:typePlaceholder")}
            rows={1}
            disabled={isPending}
            className="resize-none min-h-9 max-h-30 py-2 px-3 text-sm rounded-2xl bg-muted/60 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 scrollbar-none"
            style={{ height: "36px" }}
          />
        </div>

        {/* Emoji toggle button */}
        <button
          ref={emojiButtonRef}
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          disabled={isPending}
          tabIndex={-1}
          aria-label="Tambah emoji"
          className={cn("h-9 w-9 shrink-0 flex items-center justify-center rounded-xl transition-colors", showEmojiPicker ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground")}
        >
          <Smile size={18} />
        </button>

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
