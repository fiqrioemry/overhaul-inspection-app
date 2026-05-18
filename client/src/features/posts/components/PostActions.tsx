/* eslint-disable @typescript-eslint/no-unused-vars */
// src/features/posts/components/PostActions.tsx
import { cn } from "@/lib/utils";
import type { Post } from "@/types/posts.type";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { useLikePost, useSavePost, useUnlikePost, useUnsavePost } from "@/features/posts/posts.query";

interface PostActionsProps {
  post: Post;
  onCommentClick?: () => void;
  showCommentCount?: boolean;
}

export default function PostActions({ post, onCommentClick }: PostActionsProps) {
  const savePost = useSavePost(post.id);
  const unsavePost = useUnsavePost(post.id);
  const likePost = useLikePost(post.id);
  const unlikePost = useUnlikePost(post.id);

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

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Left: Like, Comment, Share */}
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
          <button onClick={onCommentClick} className="group flex items-center gap-1 transition-transform active:scale-90" aria-label="View comments">
            <MessageCircle className="h-6 w-6 text-foreground group-hover:text-muted-foreground transition-colors" />
          </button>
          <span>{post.totalComments ?? 0}</span>
        </div>

        {/* Share button*/}
        {/* <button className="group flex items-center gap-1 transition-transform active:scale-90" aria-label="Share post">
          <Send className="h-6 w-6 text-foreground group-hover:text-muted-foreground transition-colors" />
        </button> */}
      </div>

      {/* right bookmark */}
      <button onClick={handleSavePost} className="group transition-transform active:scale-90" aria-label="Bookmark post">
        <Bookmark className={cn(post.isSaved ? "fill-blue-500 text-blue-500" : "text-foreground group-hover:text-muted-foreground", "h-6 w-6 transition-colors")} />
      </button>
    </div>
  );
}

interface PostActionCountsProps {
  post: Post;
  onCommentClick?: () => void;
}

export function PostActionCounts({ post, onCommentClick }: PostActionCountsProps) {
  const commentsCount = post.totalComments ?? 0;

  return (
    <div className="flex flex-col gap-0.5 px-4 pb-1">
      {commentsCount > 0 && (
        <button onClick={onCommentClick} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left">
          View all {commentsCount.toLocaleString()} {commentsCount === 1 ? "comment" : "comments"}
        </button>
      )}
    </div>
  );
}
