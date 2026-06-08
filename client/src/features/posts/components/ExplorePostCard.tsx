// features/feed/components/PostCard.tsx

import { useState } from "react";
import type { Post } from "@/types/posts.type";
import { usePostStore } from "@/stores/post.store";
import { GalleryHorizontalEnd, Heart, MessageCircle, Repeat2 } from "lucide-react";
import PostDetailDialog from "@/features/posts/components/PostDetailDialog";

type PostCardProps = {
  post: Post;
};

export default function ExplorePostCard({ post }: PostCardProps) {
  const { openDialog, isOpen } = usePostStore();
  const [focusComment, setFocusComment] = useState(false);

  // Repost rows have no galleries of their own; images live in originalPost
  const displayGalleries = post.isRepost && post.originalPost?.galleries?.length
    ? post.originalPost.galleries
    : post.galleries;

  const handleImageClick = () => {
    openDialog({ isOpen: !isOpen, target: post.id });
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusComment(true);
    openDialog({ isOpen: !isOpen, target: post.id });
  };

  return (
    <>
      <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-sm bg-muted" onClick={handleImageClick}>
        {/* Gambar utama */}
        <img src={displayGalleries[0]?.url} alt={post.originalPost?.content ?? post.content} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />

        {/* Multiple images indicator */}
        {displayGalleries.length > 1 && (
          <div className="absolute right-2 top-2 rounded-sm bg-black/60 p-1">
            <GalleryHorizontalEnd size={16} className="text-white" />
          </div>
        )}

        {/* Repost indicator */}
        {post.isRepost && (
          <div className="absolute left-2 top-2 rounded-sm bg-black/60 p-1">
            <Repeat2 size={14} className="text-green-400" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-between bg-black/40 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {/* Author — atas */}
          <div className="flex items-center gap-2">
            <img src={post.user.avatar ?? "/default-avatar.png"} alt={post.user.name} className="h-7 w-7 rounded-full object-cover ring-2 ring-white/50" />
            <span className="text-xs font-medium text-white drop-shadow">{post.user.name}</span>
          </div>

          {/* Actions — bawah */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-white transition-transform active:scale-90">
              <Heart className="h-5 w-5 drop-shadow" fill={post.isLiked ? "currentColor" : "none"} strokeWidth={post.isLiked ? 0 : 2} />
              <span className="text-xs font-medium drop-shadow">{post.totalLikes}</span>
            </button>

            <button onClick={handleCommentClick} className="flex items-center gap-1 text-white transition-transform active:scale-90">
              <MessageCircle className="h-5 w-5 drop-shadow" strokeWidth={2} />
              <span className="text-xs font-medium drop-shadow">{post.totalComments}</span>
            </button>
          </div>
        </div>
      </div>
      <PostDetailDialog post={post} focusComment={focusComment} onFocused={() => setFocusComment(false)} />
    </>
  );
}
