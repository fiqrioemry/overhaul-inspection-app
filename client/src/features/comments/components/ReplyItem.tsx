// src/features/comments/components/ReplyItem.tsx
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import type { Comments } from "@/types/comments.type";
import CommentOptionMenu from "@/features/comments/components/CommentOptionMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReplyItemProps {
  reply: Comments;
  commentId: string;
  onReply?: (commentId: string, username: string) => void;
}

export default function ReplyItem({ reply, commentId, onReply }: ReplyItemProps) {
  const createdAt = reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : "";

  const handleReply = () => {
    if (onReply) {
      onReply(commentId, reply.user?.username ?? "");
    }
  };

  return (
    <div className="group flex gap-3 py-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={reply.user?.avatar ?? "/default-avatar.png"} alt={reply.user?.username} />
        <AvatarFallback className="text-[10px]">{reply.user?.username?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link to={`/profile/${reply.user?.username}`} className="hover:underline hover:text-blue-500 font-semibold transition-colors">
              {reply.user?.username}
            </Link>
            <span className="text-muted-foreground"> · </span>
            <span className="wrap-break-words">{reply.content}</span>
          </div>

          <CommentOptionMenu commentId={reply.id} isEditable={reply.isEditable ?? false} />
        </div>

        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          {createdAt && <span>{createdAt}</span>}
          {(reply.totalLikes ?? 0) > 0 && (
            <span>
              {reply.totalLikes} {reply.totalLikes === 1 ? "like" : "likes"}
            </span>
          )}
          <button onClick={handleReply} className="font-semibold hover:text-foreground transition-colors">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
