// src/features/posts/components/FeedPostCard.tsx
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/posts.type";
import PostHeading from "@/features/posts/components/PostHeading";
import PostGallery from "@/features/posts/components/PostGallery";
import { useLikePost, useUnlikePost } from "@/features/posts/posts.query";
import PostDetailDialog from "@/features/posts/components/PostDetailDialog";
// import CreateCommentForm from "@/features/comments/components/CreateCommentForm";
import PostActions, { PostActionCounts } from "@/features/posts/components/PostActions";

interface FeedPostCardProps {
  post: Post;
}

export default function FeedPostCard({ post }: FeedPostCardProps) {
  const likePost = useLikePost(post.id);
  const unlikePost = useUnlikePost(post.id);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  function handleLike() {
    const action = post.isLiked ? unlikePost : likePost;
    action.mutate();
  }

  const images = post.galleries ?? [];
  const createdAt = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";

  const caption = post.content ?? "";
  const captionTrimmed = caption.length > 125 && !captionExpanded;

  return (
    <>
      <article className="flex flex-col border-b last:border-b-0 mb-6">
        <PostHeading post={post} />

        {images.length > 0 && (
          <div className="cursor-pointer" onDoubleClick={handleLike}>
            <PostGallery images={images} alt={caption} aspectRatio="square" />
          </div>
        )}

        <PostActions post={post} />

        <PostActionCounts post={post} />

        {caption && (
          <p className="px-4 pb-1 text-sm leading-relaxed">
            <span className="font-semibold mr-1">{post.user?.username}</span>
            {captionTrimmed ? (
              <>
                {caption.slice(0, 125)}
                {"... "}
                <button onClick={() => setCaptionExpanded(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  more
                </button>
              </>
            ) : (
              caption
            )}
          </p>
        )}

        {createdAt && <span className="px-4 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{createdAt}</span>}

        {/* <div className="border-t mt-1 ">
          <CreateCommentForm postId={post.id} placeholder="Add a comment..." compact />
        </div> */}
      </article>

      <PostDetailDialog post={post} />
    </>
  );
}
