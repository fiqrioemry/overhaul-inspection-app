// src/features/posts/pages/FeedPage.tsx
import { useEffect, useRef } from "react";
import { Loader2, Rss } from "lucide-react";
import type { Post } from "@/types/posts.type";
import FeedPostCard from "@/features/posts/components/FeedPostCard";
import { useInfiniteFollowingPosts } from "@/features/posts/posts.query";
import FeedPostCardSkeleton from "@/features/posts/components/FeedPostCardSkeleton";

export default function FeedPage() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteFollowingPosts({ limit: 3 });

  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="mx-auto max-w-117.5 w-full">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight">Feed</h1>
      </div>

      <div className="divide-y">
        {/* Initial loading skeletons */}
        {isLoading && Array.from({ length: 3 }).map((_, i) => <FeedPostCardSkeleton key={i} />)}

        {/* Actual posts */}
        {allPosts.map((post: Post | undefined) => (post ? <FeedPostCard key={post.id} post={post} /> : null))}

        {/* "Loading more" skeletons */}
        {isFetchingNextPage && Array.from({ length: 2 }).map((_, i) => <FeedPostCardSkeleton key={`more-${i}`} />)}
      </div>

      <div ref={observerTarget} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more posts...
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && <p className="text-sm text-muted-foreground">You've reached the end</p>}
      </div>

      {!isLoading && allPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Rss className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Your feed is empty</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Follow people to see their latest posts right here in your feed.</p>
        </div>
      )}
    </div>
  );
}
