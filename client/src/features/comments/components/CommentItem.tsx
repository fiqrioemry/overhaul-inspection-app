// src/features/comments/components/CommentItem.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import type { Comments } from "@/types/comments.type";
import ReplyList from "@/features/comments/components/ReplyList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommentOptionMenu from "@/features/comments/components/CommentOptionMenu";

interface CommentItemProps {
  postId: string;
  comment: Comments;
  onReply?: (commentId: string, username: string) => void;
}

export default function CommentItem({ postId, comment, onReply }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  const handleReply = () => {
    if (!comment.id || !comment.user?.username) return;
    onReply?.(comment.id, comment.user.username);
  };

  const totalReplies = comment.totalReplies ?? 0;

  return (
    <div className="group flex gap-3 py-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.user?.avatar ?? "/default-avatar.png"} alt={comment.user?.username} />
        <AvatarFallback className="text-xs">{comment.user?.username?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Content */}
        <div className="text-sm flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link to={`/profile/${comment.user?.username}`} className="hover:underline hover:text-blue-500 font-semibold transition-colors">
              {comment.user?.username}
            </Link>
            <span className="text-muted-foreground"> · </span>
            <span className="wrap-break-words">{comment.content}</span>
          </div>

          {/* Options Menu - Shows on hover if editable */}
          <CommentOptionMenu commentId={comment.id} isEditable={comment.isEditable ?? false} />
        </div>

        {/* Meta row */}
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          {comment.createdAt && <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>}
          {(comment.totalLikes ?? 0) > 0 && (
            <span>
              {comment.totalLikes} {comment.totalLikes === 1 ? "like" : "likes"}
            </span>
          )}
          <button onClick={handleReply} className="font-semibold hover:text-foreground transition-colors">
            Reply
          </button>
        </div>

        {totalReplies > 0 && (
          <div className="mt-1.5">
            <button onClick={() => setShowReplies((prev) => !prev)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <span className="inline-block w-4 h-px bg-muted-foreground/50" />
              {showReplies ? "Hide replies" : `See ${totalReplies} ${totalReplies === 1 ? "reply" : "replies"}`}
            </button>

            {showReplies && (
              <div className="mt-1">
                <ReplyList postId={postId} commentId={comment.id} onReply={onReply} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
