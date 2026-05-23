// src/features/posts/components/EditPostDialog.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import EditPostForm from "@/features/posts/components/EditPostForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface EditPostDialogProps {
  post: Post;
}

export default function EditPostDialog({ post }: EditPostDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { isEditOpen, editTarget, openEditDialog } = usePostStore();

  const isOpen = isEditOpen && editTarget === post.id;

  function handleOpenChange(open: boolean) {
    if (!isPending) {
      openEditDialog({ isEditOpen: open, editTarget: post.id });
    }
  }

  function handleSuccess() {
    openEditDialog({ isEditOpen: false, editTarget: "" });
  }

  const hasImages = post.galleries && post.galleries.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "xl:w-auto xl:h-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0",
          "xl:inset-0 xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2",
          hasImages ? "xl:w-[min(95vw,860px)] xl:h-140" : "xl:w-[min(95vw,480px)] xl:h-auto",
          "flex flex-col transition-all duration-300 p-0 overflow-hidden rounded-xl",
        )}
        showCloseButton={false}
      >
        {/* Loading bar */}
        <div className={cn("h-0.5 w-full bg-border overflow-hidden shrink-0", !isPending && "invisible")}>
          <div className="h-full bg-primary animate-loading-bar" />
        </div>

        <EditPostForm post={post} onSuccess={handleSuccess} onClose={() => handleOpenChange(false)} isPendingChange={setIsPending} />
      </DialogContent>
    </Dialog>
  );
}
