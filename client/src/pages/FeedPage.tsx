// src/features/posts/pages/FeedPage.tsx
import { useEffect, useRef } from "react";
import { Loader2, Rss } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import type { Post } from "@/types/posts.type";
import FeedPostCard from "@/features/posts/components/FeedPostCard";
import { useInfiniteFollowingPosts } from "@/features/posts/posts.query";
import FeedPostCardSkeleton from "@/features/posts/components/FeedPostCardSkeleton";

export default function FeedPage() {
  const { t } = useTranslation(["post"]);
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
    <>
      <Helmet>
        <title>Feed - Pixel social media</title>
        <meta name="description" content="Stay updated with the latest posts from people you follow on Pixel social media." />
        <meta name="keywords" content="feed, posts, social media, following" />
        <meta property="og:title" content="Feed - Pixel social media" />
        <meta property="og:description" content="Stay updated with the latest posts from people you follow on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com" />
      </Helmet>
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
              {t("post:loadingMorePosts")}
            </div>
          )}
          {!hasNextPage && allPosts.length > 0 && <p className="text-sm text-muted-foreground">{t("post:noMorePosts")}</p>}
        </div>

        {!isLoading && allPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Rss className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t("post:emptyFeedTitle")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">{t("post:emptyFeedMessage")}</p>
          </div>
        )}
      </div>
    </>
  );
}
