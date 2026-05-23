// src/features/posts/components/CommentList.tsx
import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useComments } from "@/features/comments/comments.query";
import CommentItem from "@/features/comments/components/CommentItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CommentList({ post }: { post: Post }) {
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { onReply } = usePostStore();

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useComments({ postId: post.id, limit: 3 });

  const allComments = data?.pages.flatMap((page) => page.data) ?? [];

  const handleReply = (commentId: string, username: string) => {
    onReply?.({ commentId, username });
  };

  const createdAt = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";

  return (
    <>
      {/* Comments / Caption scroll area */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 space-y-0.5">
          {/* Caption as first "comment" */}
          {post.content && (
            <div className="flex gap-3 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={post.user?.avatar ?? "/default-avatar.png"} alt={post.user?.username} />
                <AvatarFallback className="text-xs">{post.user?.username?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-semibold mr-1">{post.user?.username}</span>
                  <span className="wrap-break-words">{post.content}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{createdAt}</div>
              </div>
            </div>
          )}

          {/* Comments list */}
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {allComments.map((comment) => (
            <CommentItem postId={post.id} key={comment?.id} comment={comment!} onReply={handleReply} />
          ))}

          {/* Load more */}
          {hasNextPage && (
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Load more comments"}
            </button>
          )}

          {!isLoading && allComments.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No comments yet. Be the first to comment!</div>}

          <div ref={commentsEndRef} />
        </div>
      </ScrollArea>
    </>
  );
}
