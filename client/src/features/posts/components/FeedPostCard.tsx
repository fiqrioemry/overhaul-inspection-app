// src/features/posts/components/FeedPostCard.tsx
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@/types/posts.type";
import PostHeading from "@/features/posts/components/PostHeading";
import PostGallery from "@/features/posts/components/PostGallery";
import { useLikePost, useUnlikePost } from "@/features/posts/posts.query";
import PostDetailDialog from "@/features/posts/components/PostDetailDialog";
import PostActions, { PostActionCounts } from "@/features/posts/components/PostActions";
import ContentRenderer from "@/components/common/ContentRenderer";
import { Repeat2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FeedPostCardProps {
  post: Post;
}

export default function FeedPostCard({ post }: FeedPostCardProps) {
  const { t } = useTranslation(["post"]);
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
        {/* Repost banner */}
        {post.isRepost && (
          <div className="flex items-center gap-1.5 px-4 pt-2 pb-0 text-xs text-muted-foreground">
            <Repeat2 className="size-3.5 text-green-500" />
            <span>
              {t("post:repostedBy")} <span className="font-semibold text-foreground">{post.user?.username}</span>
            </span>
          </div>
        )}

        <PostHeading post={post} />

        {images.length > 0 && (
          <div className="cursor-pointer" onDoubleClick={handleLike}>
            <PostGallery images={images} alt={caption} aspectRatio="square" />
          </div>
        )}

        <PostActions post={post} />

        <PostActionCounts post={post} />

        {/* Reposter's caption */}
        {post.isRepost && post.caption && (
          <p className="px-4 pb-1 text-sm leading-relaxed italic text-muted-foreground">
            <span className="font-semibold not-italic text-foreground mr-1">{post.user?.username}</span>
            {post.caption}
          </p>
        )}

        {caption && !post.isRepost && (
          <p className="px-4 pb-1 text-sm leading-relaxed">
            <span className="font-semibold mr-1">{post.user?.username}</span>
            {captionTrimmed ? (
              <>
                <ContentRenderer content={caption.slice(0, 125)} />
                {"... "}
                <button onClick={() => setCaptionExpanded(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("post:more")}
                </button>
              </>
            ) : (
              <ContentRenderer content={caption} />
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
