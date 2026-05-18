// src/features/comments/components/ReplyList.tsx
import { Loader2 } from "lucide-react";
import ReplyItem from "@/features/comments/components/ReplyItem";
import { useReplies } from "@/features/comments/comments.query";

interface ReplyListProps {
  postId?: string;
  commentId: string;
  onReply?: (commentId: string, username: string) => void;
}

export default function ReplyList({ commentId, postId, onReply }: ReplyListProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useReplies({ postId, commentId, limit: 3 });

  const allReplies = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allReplies.length === 0) return null;

  return (
    <div className="flex flex-col">
      {allReplies.map((reply) => (
        <ReplyItem key={reply?.id} reply={reply!} onReply={onReply} commentId={commentId} />
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="self-start py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          {isFetchingNextPage ? <Loader2 className="h-3 w-3 animate-spin" /> : "See more replies"}
        </button>
      )}
    </div>
  );
}
