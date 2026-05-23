// src/features/posts/components/CreatePostDialog.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import CreatePostForm from "@/features/posts/components/CreatePostForm";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [hasImages, setHasImages] = useState(false);
  const [isPending, setIsPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            // Base — mobile full screen
            "fixed inset-0 z-50 bg-popover text-sm text-popover-foreground outline-none",
            // Animation
            "duration-200",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",

            // sm–lg: floating card centered (override inset-0)
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:rounded-xl sm:ring-1 sm:ring-foreground/10",
            "sm:h-auto sm:max-h-[90dvh]",
            hasImages ? "sm:w-[min(95vw,480px)]" : "sm:w-[min(95vw,400px)]",

            // xl: lebar lebih besar saat ada gambar
            hasImages ? "xl:w-[min(95vw,860px)] xl:h-140" : "xl:w-[min(95vw,480px)]",

            "flex flex-col transition-all duration-300",
          )}
        >
          {/* Loading bar */}
          <div className={cn("h-0.5 w-full bg-border overflow-hidden shrink-0", !isPending && "invisible")}>
            <div className="h-full bg-primary animate-loading-bar" />
          </div>

          <CreatePostForm onSuccess={() => onOpenChange(false)} onClose={() => onOpenChange(false)} onHasImagesChange={setHasImages} isPendingChange={setIsPending} />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
