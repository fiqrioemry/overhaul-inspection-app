// src/features/hashtags/components/HashtagPostList.tsx
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { Post } from "@/types/posts.type";
import { useInfiniteHashtagPosts } from "@/features/hashtags/hashtags.query";
import ExplorePostCard from "@/features/posts/components/ExplorePostCard";
import PostGridSkeleton from "@/components/common/PostGridSkeleton";

interface HashtagPostListProps {
  name: string;
}

export default function HashtagPostList({ name }: HashtagPostListProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteHashtagPosts(name, 9);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const current = observerTarget.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {isLoading && <PostGridSkeleton count={9} />}
        {allPosts.map((post: Post | undefined) => post && <ExplorePostCard key={post.id} post={post} />)}
        {isFetchingNextPage && <PostGridSkeleton count={9} />}
      </div>

      <div ref={observerTarget} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more posts...
          </div>
        )}
        {!isLoading && !hasNextPage && allPosts.length > 0 && <p className="text-sm text-muted-foreground">You've reached the end</p>}
        {!isLoading && allPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts found for #{name}</p>}
      </div>
    </div>
  );
}
