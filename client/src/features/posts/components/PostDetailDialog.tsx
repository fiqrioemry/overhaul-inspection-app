// src/features/posts/components/PostDetailDialog.tsx
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import PostGallery from "@/features/posts/components/PostGallery";
import PostHeading from "@/features/posts/components/PostHeading";
import CommentList from "@/features/comments/components/CommentList";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CreateCommentForm from "@/features/comments/components/CreateCommentForm";
import PostActions, { PostActionCounts } from "@/features/posts/components/PostActions";

interface PostDetailDialogProps {
  post: Post;
}

export default function PostDetailDialog({ post }: PostDetailDialogProps) {
  const { isOpen, target, openDialog, replyTo, onReply } = usePostStore();

  // Reset reply state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) onReply?.(null);
    openDialog({ isOpen: open, target: post.id });
  };

  const handleCancelReply = () => {
    onReply?.(null);
  };

  const images = post.galleries ?? [];
  const createdAt = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";

  return (
    <Dialog open={isOpen && target === post.id} onOpenChange={handleOpenChange}>
      <DialogContent aria-description="post-detail" showCloseButton={false} className="w-full p-0 overflow-hidden rounded-xl h-[90vh] flex flex-col md:flex-row">
        {/* image */}
        <DialogTitle className="sr-only">Post details</DialogTitle>
        <div className="md:w-1/2 bg-black flex items-center justify-center shrink-0">
          {images.length > 0 ? <PostGallery images={images} alt={post.content} aspectRatio="auto" /> : <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">No image</div>}
        </div>

        {/* content */}
        <div className="flex flex-col flex-1 overflow-hidden border-l">
          {/* Header */}
          <PostHeading post={post} />

          {/* comment list section */}
          <CommentList post={post} />

          {/* Actions */}
          <div className="border-t shrink-0">
            <PostActions post={post} />
            <PostActionCounts post={post} />
            {createdAt && <span className="block px-4 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{createdAt}</span>}
          </div>

          {/* Comment / Reply input */}
          <div className="border-t shrink-0">
            <CreateCommentForm postId={post.id} parentCommentId={replyTo?.commentId} replyToUsername={replyTo?.username} placeholder="Add a comment..." onCancel={handleCancelReply} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
