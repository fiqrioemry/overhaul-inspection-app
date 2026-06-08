import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Post } from "@/types/posts.type";
import { useSharePost } from "@/features/posts/posts.query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Repeat2 } from "lucide-react";

interface SharePostDialogProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SharePostDialog({ post, open, onOpenChange }: SharePostDialogProps) {
  const { t } = useTranslation(["post"]);
  const [caption, setCaption] = useState("");
  const sharePost = useSharePost(post.id);

  // Always show the original post content in the preview
  const preview = post.isRepost && post.originalPost ? post.originalPost : post;

  function handleShare() {
    sharePost.mutate(
      { caption: caption.trim() || undefined },
      {
        onSuccess: () => {
          setCaption("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md xl:w-full xl:h-auto xl:max-w-md p-6 flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat2 className="size-5" />
            {t("post:sharePostTitle")}
          </DialogTitle>
          <DialogDescription>{t("post:sharePostDescription")}</DialogDescription>
        </DialogHeader>

        {/* Original post preview */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={preview.user?.avatar ?? undefined} />
              <AvatarFallback className="text-xs">{preview.user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{preview.user?.username}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">{preview.content}</p>
        </div>

        {/* Caption input */}
        <div className="space-y-1">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("post:shareCaptionPlaceholder")}
            maxLength={500}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{caption.length}/500</p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sharePost.isPending}>
            {t("post:cancelButton")}
          </Button>
          <Button onClick={handleShare} disabled={sharePost.isPending}>
            {sharePost.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
            {t("post:sharePost")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
