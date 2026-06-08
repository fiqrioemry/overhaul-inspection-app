import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import { Heart, MessageCircle, Bookmark, Send, Check, Repeat2, Loader2 } from "lucide-react";
import { useLikePost, useSavePost, useUnlikePost, useUnsavePost, useUnsharePost } from "@/features/posts/posts.query";
import SharePostDialog from "@/features/posts/components/SharePostDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface PostActionsProps {
  post: Post;
  showCommentCount?: boolean;
  onCommentClick?: () => void;
}

export default function PostActions({ post, onCommentClick }: PostActionsProps) {
  const { t } = useTranslation(["post"]);
  const [copied, setCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [unshareDialogOpen, setUnshareDialogOpen] = useState(false);
  const savePost = useSavePost(post.id);
  const unsavePost = useUnsavePost(post.id);
  const likePost = useLikePost(post.id);
  const unlikePost = useUnlikePost(post.id);
  const { isOpen, openDialog } = usePostStore();

  // For unshare we need the original post id
  const unshareTargetId = post.isRepost ? (post.originalPost?.id ?? post.id) : post.id;
  const unsharePost = useUnsharePost(unshareTargetId);

  const isLiked = post.isLiked ?? false;

  function handleLikeToggle() {
    const action = isLiked ? unlikePost : likePost;
    action.mutate();
  }

  function handleSavePost() {
    const action = post.isSaved ? unsavePost : savePost;
    action.mutate();
  }

  const isPending = likePost.isPending || unlikePost.isPending;

  const handleComment = () => {
    if (onCommentClick) {
      onCommentClick();
      return;
    }
    if (!isOpen) openDialog({ isOpen: true, target: post.id });
  };

  async function handleShare() {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check this post",
          text: post.content ?? "View this post",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  }

  function handleRepostClick() {
    if (post.isReposted) {
      setUnshareDialogOpen(true);
    } else {
      setShareDialogOpen(true);
    }
  }

  function handleUnshareConfirm() {
    unsharePost.mutate(undefined, {
      onSuccess: () => setUnshareDialogOpen(false),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Like, Comment, Share, Repost */}
        <div className="flex items-center gap-3">
          {/* Like */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLikeToggle}
              disabled={isPending}
              className={cn("group flex items-center gap-1 transition-transform active:scale-90", isPending && "opacity-50 cursor-not-allowed")}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              <Heart className={cn("h-6 w-6 transition-all duration-200", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-foreground group-hover:text-red-400")} />
            </button>
            <span>{post.totalLikes ?? 0}</span>
          </div>

          {/* Comment */}
          <div className="flex items-center gap-2">
            <button disabled={!onCommentClick && isOpen} onClick={handleComment} className="group flex items-center gap-1 transition-transform active:scale-90" aria-label="View comments">
              <MessageCircle className="h-6 w-6 text-foreground group-hover:text-muted-foreground transition-colors" />
            </button>
            <span>{post.totalComments ?? 0}</span>
          </div>

          {/* Share link */}
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="group flex items-center gap-1 transition-transform active:scale-90" aria-label={t("post:shareLink")}>
              {copied ? <Check className="h-6 w-6 text-green-500 transition-all animate-in zoom-in-50" /> : <Send className="h-6 w-6 text-foreground group-hover:text-muted-foreground transition-colors" />}
            </button>
            {copied && <span className="text-xs text-green-500 animate-in fade-in">{t("post:copied")}</span>}
          </div>

          {/* Repost */}
          <div className="flex items-center gap-2">
            <button onClick={handleRepostClick} className="group flex items-center gap-1 transition-transform active:scale-90" aria-label={post.isReposted ? t("post:unsharePost") : t("post:sharePost")}>
              <Repeat2 className={cn("h-6 w-6 transition-colors", post.isReposted ? "text-green-500" : "text-foreground group-hover:text-muted-foreground")} />
            </button>
            {(post.shareCount ?? 0) > 0 && <span className="text-sm">{post.shareCount}</span>}
          </div>
        </div>

        {/* Right: Bookmark */}
        <button onClick={handleSavePost} className="group transition-transform active:scale-90" aria-label={t("post:bookmark")}>
          <Bookmark className={cn(post.isSaved ? "fill-blue-500 text-blue-500" : "text-foreground group-hover:text-muted-foreground", "h-6 w-6 transition-colors")} />
        </button>
      </div>

      {/* Share (new repost) dialog */}
      <SharePostDialog post={post} open={shareDialogOpen} onOpenChange={setShareDialogOpen} />

      {/* Unshare confirmation dialog */}
      <AlertDialog open={unshareDialogOpen} onOpenChange={setUnshareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("post:unsharePostTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("post:unsharePostDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unsharePost.isPending}>{t("post:cancelButton")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnshareConfirm} disabled={unsharePost.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {unsharePost.isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              {t("post:unsharePost")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PostActionCountsProps {
  post: Post;
  commentRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function PostActionCounts({ post }: PostActionCountsProps) {
  const { isOpen, openDialog } = usePostStore();
  const handleComment = () => {
    openDialog({ isOpen: !isOpen, target: post.id });
  };
  const commentsCount = post.totalComments ?? 0;

  return (
    <div className="flex flex-col gap-0.5 px-4 pb-1">
      {commentsCount > 0 && !isOpen && (
        <button onClick={handleComment} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">
          View all {commentsCount.toLocaleString()} {commentsCount === 1 ? "comment" : "comments"}
        </button>
      )}
    </div>
  );
}
