// src/features/posts/components/PostDetailDialog.tsx
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/posts.type";
import PostActions from "@/features/posts/components/PostActions";
import PostGallery from "@/features/posts/components/PostGallery";
import PostHeading from "@/features/posts/components/PostHeading";
import CommentList from "@/features/comments/components/CommentList";
import CreateCommentForm from "@/features/comments/components/CreateCommentForm";

interface PostDetailCardProps {
  post: Post | null;
}

interface ReplyTo {
  commentId: string;
  username: string;
}

export default function PostDetailCard({ post }: PostDetailCardProps) {
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  if (!post) return null;
  const images = post.galleries ?? [];
  const createdAt = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";

  return (
    <div className="w-full p-0 overflow-hidden rounded-xl h-[90vh] flex flex-col md:flex-row border">
      <div className="w-full p-0 overflow-hidden rounded-xl h-[90vh] flex flex-col md:flex-row">
        {/* image */}
        <div className="md:w-1/2 bg-black flex items-center justify-center shrink-0">
          {images.length > 0 ? <PostGallery images={images} alt={post.content} aspectRatio="auto" /> : <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">No image</div>}
        </div>

        {/* content */}
        <div className="flex flex-col flex-1 overflow-hidden border-l">
          {/* Header */}
          <PostHeading post={post} />

          {/* comment list section */}
          <CommentList post={post} setReplyTo={setReplyTo} />

          {/* Actions */}
          <div className="border-t shrink-0">
            <PostActions post={post} />
            {createdAt && <span className="block px-4 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{createdAt}</span>}
          </div>

          {/* Comment / Reply input */}
          <div className="border-t shrink-0">
            <CreateCommentForm postId={post.id} parentCommentId={replyTo?.commentId} replyToUsername={replyTo?.username} placeholder="Add a comment..." onCancel={handleCancelReply} />
          </div>
        </div>
      </div>
    </div>
  );
}
