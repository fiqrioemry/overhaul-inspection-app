// src/features/posts/components/ReportPostDialog.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import { useTranslation } from "react-i18next";
import { Dialog as DialogPrimitive } from "radix-ui";
import ReportPostForm from "@/features/posts/components/ReportPostForm";
import { Dialog, DialogPortal, DialogOverlay, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ReportPostDialog({ post }: { post: Post }) {
  const [isPending, setIsPending] = useState(false);
  const { t } = useTranslation(["post"]);
  const { isReportOpen, reportTarget, openReportDialog } = usePostStore();

  function handleOpenChange(next: boolean) {
    if (!isPending) openReportDialog({ isReportOpen: next, reportTarget: "" });
  }

  function handleSuccess() {
    openReportDialog({ isReportOpen: false, reportTarget: "" });
  }

  return (
    <Dialog open={isReportOpen && reportTarget === post.id} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            // Base
            "fixed z-50 bg-popover text-sm text-popover-foreground outline-none",
            "duration-200",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",

            // Mobile: bottom sheet
            "inset-x-0 bottom-0 top-auto",
            "rounded-t-2xl",
            "h-auto max-h-[90dvh]",

            // sm+: floating card centered
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:rounded-xl sm:ring-1 sm:ring-foreground/10",
            "sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90dvh]",

            "flex flex-col p-0 overflow-hidden",
            "transition-[height] duration-300 ease-in-out",
          )}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Loading bar */}
          <div className={cn("h-0.5 w-full bg-border overflow-hidden shrink-0", !isPending && "invisible")}>
            <div className="h-full bg-destructive animate-loading-bar" />
          </div>

          <div className="px-6 pt-4 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">{t("post:reportPost")}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t("post:reportPostDescription")}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto flex flex-col">
            <ReportPostForm post={post} onSuccess={handleSuccess} onClose={() => handleOpenChange(false)} isPendingChange={setIsPending} />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
