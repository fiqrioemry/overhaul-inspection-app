/* eslint-disable @typescript-eslint/no-unused-vars */

import { cn } from "@/lib/utils";
import { Smile, Send, X } from "lucide-react";
import { useTheme } from "next-themes"; // remove if not using next-themes
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useCreateComment } from "@/features/comments/comments.query";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";

interface CreateCommentFormProps {
  postId: string;
  parentCommentId?: string;
  replyToUsername?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function CreateCommentForm({ postId, parentCommentId, replyToUsername, placeholder = "Add a comment...", autoFocus = false, onSuccess, onCancel, compact = false }: CreateCommentFormProps) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [chipWidth, setChipWidth] = useState(0);
  const createComment = useCreateComment();

  // If you're not using next-themes, replace with:
  // const resolvedTheme = "light";
  const { resolvedTheme } = useTheme();

  const isReplyMode = !!parentCommentId && !!replyToUsername;

  // Measure chip width whenever replyToUsername changes
  useLayoutEffect(() => {
    if (chipRef.current) {
      setChipWidth(chipRef.current.offsetWidth);
    } else {
      setChipWidth(0);
    }
  }, [replyToUsername, parentCommentId]);

  // Focus textarea when entering reply mode
  useEffect(() => {
    if (isReplyMode) {
      setTimeout(() => {
        setShowEmojiPicker(false);
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isReplyMode]);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

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

  const resetHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !createComment.isPending;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    resetHeight();
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const newContent = content.slice(0, start) + emojiData.emoji + content.slice(end);

    setContent(newContent);

    // Restore cursor position after emoji insertion
    requestAnimationFrame(() => {
      const newPos = start + emojiData.emoji.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
      resetHeight();
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const finalContent = isReplyMode ? `@${replyToUsername} ${trimmed}` : trimmed;

    createComment.mutate(
      { postId, content: finalContent, commentId: parentCommentId },
      {
        onSuccess: () => {
          setContent("");
          resetHeight();
          setShowEmojiPicker(false);
          onSuccess?.();
          onCancel?.();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === "Escape") {
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
        return;
      }
      onCancel?.();
      return;
    }
    // Backspace on empty content in reply mode -> cancel reply
    if (e.key === "Backspace" && content === "" && isReplyMode) {
      e.preventDefault();
      onCancel?.();
    }
  };

  const handleCancel = () => {
    setContent("");
    setShowEmojiPicker(false);
    onCancel?.();
  };

  const textareaLeftPadding = isReplyMode && chipWidth > 0 ? chipWidth + 8 : 0;

  return (
    <div className="relative">
      {/* Emoji Picker anchored above the form */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT} lazyLoadEmojis searchPlaceholder="Search emoji..." width={300} height={380} />
        </div>
      )}

      <div className={cn("flex items-end gap-2", compact ? "px-3 py-2" : "px-4 py-3")}>
        {/* Emoji toggle button */}
        <button
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={cn("mb-1 shrink-0 transition-colors", showEmojiPicker ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          aria-label="Add emoji"
          tabIndex={-1}
          type="button"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Input wrapper */}
        <div className="relative flex-1 flex items-start">
          {/* Mention chip */}
          {isReplyMode && (
            <span
              ref={chipRef}
              className={cn(
                "absolute left-0 z-10 inline-flex items-center gap-1",
                "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
                "text-xs font-medium rounded px-1.5 py-0.5 select-none whitespace-nowrap",
                compact ? "top-0.5" : "top-1",
              )}
              aria-hidden="true"
            >
              @{replyToUsername}
            </span>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isReplyMode ? `Reply to @${replyToUsername}...` : placeholder}
            rows={1}
            className={cn("w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground outline-none", "leading-relaxed overflow-hidden transition-all", compact ? "py-0.5" : "py-1")}
            style={{
              minHeight: "20px",
              paddingLeft: textareaLeftPadding > 0 ? `${textareaLeftPadding}px` : undefined,
            }}
            aria-label="Comment text"
          />
        </div>

        {/* Cancel button — reply mode only */}
        {isReplyMode && (
          <button onClick={handleCancel} className="mb-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel reply" type="button">
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn("mb-0.5 shrink-0 text-sm font-semibold transition-all", canSubmit ? "text-blue-500 hover:text-blue-600 active:scale-95" : "text-blue-300 cursor-not-allowed")}
          aria-label="Post comment"
          type="button"
        >
          {compact ? <Send className={cn("h-4 w-4 transition-transform", canSubmit && "translate-x-0.5")} /> : "Post"}
        </button>
      </div>
    </div>
  );
}
