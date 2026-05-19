import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
      <DialogContent
        className={cn(
          // Reset the shared dialog's xl overrides
          "xl:w-auto xl:h-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0",
          "xl:inset-0 xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2",
          // Our sizing: compact with no images, wide with images
          hasImages ? "xl:w-[min(95vw,860px)] xl:h-140" : "xl:w-[min(95vw,480px)] xl:h-auto",
          "flex flex-col transition-all duration-300",
        )}
        showCloseButton={false}
      >
        {/* Loading bar */}
        <div className={cn("h-0.5 w-full bg-border overflow-hidden shrink-0", !isPending && "invisible")}>
          <div className="h-full bg-primary animate-loading-bar" />
        </div>

        <CreatePostForm onSuccess={() => onOpenChange(false)} onClose={() => onOpenChange(false)} onHasImagesChange={setHasImages} isPendingChange={setIsPending} />
      </DialogContent>
    </Dialog>
  );
}
