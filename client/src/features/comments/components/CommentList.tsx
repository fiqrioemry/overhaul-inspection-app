// src/features/comments/components/CommentList.tsx
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import { useRef, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useComments } from "@/features/comments/comments.query";
import CommentItem from "@/features/comments/components/CommentItem";
import ContentRenderer from "@/components/common/ContentRenderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CommentList({ post }: { post: Post }) {
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { onReply } = usePostStore();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useComments({ postId: post.id, limit: 3 });

  const allComments = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const handleReply = useCallback(
    (commentId: string, username: string) => {
      onReply?.({ commentId, username });
    },
    [onReply],
  );

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const createdAt = useMemo(() => (post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""), [post.createdAt]);

  return (
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 space-y-0.5">
        {post.content && (
          <div className="flex gap-3 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={post.user?.avatar ?? "/default-avatar.png"} alt={post.user?.username} />
              <AvatarFallback className="text-xs">{post.user?.username?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-semibold mr-1">{post.user?.username}</span>
                <ContentRenderer content={post.content} className="text-sm whitespace-pre-wrap wrap-break-word" />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {createdAt} {post.updatedAt ? "· edited" : ""}
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {allComments.map((comment) => (
          // React.memo on CommentItem is what makes useCallback above worthwhile
          <CommentItem postId={post.id} key={comment?.id} comment={comment!} onReply={handleReply} />
        ))}
        {hasNextPage && (
          <button onClick={handleLoadMore} disabled={isFetchingNextPage} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Load more comments"}
          </button>
        )}
        {!isLoading && allComments.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No comments yet. Be the first to comment!</div>}
        <div ref={commentsEndRef} />
      </div>
    </ScrollArea>
  );
}
