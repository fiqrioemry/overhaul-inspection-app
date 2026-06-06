// src/pages/ExplorePage.tsx
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Post } from "@/types/posts.type";
import PostGridSkeleton from "@/components/common/PostGridSkeleton";
import { useInfinitePublicPosts } from "@/features/posts/posts.query";
import ExplorePostCard from "@/features/posts/components/ExplorePostCard";
import TrendingHashtags from "@/features/hashtags/components/TrendingHashtags";
import { Helmet } from "react-helmet-async";

export default function ExplorePage() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfinitePublicPosts({ limit: 9 });

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

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <>
      <Helmet>
        <title>Explore - Pixel social media</title>
        <meta name="description" content="Explore the latest posts and discover new content on Pixel social media." />
        <meta name="keywords" content="explore, posts, social media, discover" />
        <meta property="og:title" content="Explore - Pixel social media" />
        <meta property="og:description" content="Explore the latest posts and discover new content on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/explore" />
      </Helmet>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
        </div>

        {/* Trending Hashtags */}
        <TrendingHashtags limit={10} variant="explore" />

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {/* Initial Loading */}
          {isLoading && <PostGridSkeleton count={9} />}

          {/* Posts */}
          {allPosts.map((post: Post | undefined) => post && <ExplorePostCard key={post.id} post={post} />)}

          {/* Loading More Skeleton */}
          {isFetchingNextPage && <PostGridSkeleton count={9} />}
        </div>

        {/* Intersection Observer Target */}
        <div ref={observerTarget} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more posts...
            </div>
          )}
          {!hasNextPage && allPosts.length > 0 && <p className="text-sm text-muted-foreground">You've reached the end</p>}
        </div>
      </div>
    </>
  );
}
