import { useEffect, useRef } from "react";
import type { Post } from "@/types/posts.type";
import { Loader2, Grid2X2, Bookmark } from "lucide-react";
import PostGridSkeleton from "@/components/common/PostGridSkeleton";
import ExplorePostCard from "@/features/posts/components/ExplorePostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useInfiniteSavedPosts, useInfiniteUserPosts } from "@/features/posts/posts.query";

interface PostsGridProps {
  userId: string;
  saved?: boolean;
}

function PostsGrid({ userId, saved = false }: PostsGridProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  const userPosts = useInfiniteUserPosts({ userId, limit: 9 });
  const savedPosts = useInfiniteSavedPosts({ userId, limit: 3 }, saved);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = saved ? savedPosts : userPosts;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {isLoading && <PostGridSkeleton count={9} />}
        {allPosts.map((post: Post | undefined) => post && <ExplorePostCard key={post.id} post={post} />)}
        {isFetchingNextPage && <PostGridSkeleton count={9} />}
      </div>

      <div ref={observerRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading more...
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && <p className="text-sm text-muted-foreground">You've reached the end</p>}
        {!isLoading && allPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet.</p>}
      </div>
    </div>
  );
}

interface ProfilePostsTabProps {
  userId: string;
  isOwner: boolean;
}

export default function ProfilePostsTab({ userId, isOwner }: ProfilePostsTabProps) {
  return (
    <Tabs defaultValue="posts">
      <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
        <TabsTrigger value="posts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none py-3 gap-2">
          <Grid2X2 className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Posts</span>
        </TabsTrigger>

        {/* Saved tab — only visible to profile owner */}
        {isOwner && (
          <TabsTrigger value="saved" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none py-3 gap-2">
            <Bookmark className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Saved</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="posts" className="mt-4">
        <PostsGrid userId={userId} />
      </TabsContent>

      {isOwner && (
        <TabsContent value="saved" className="mt-4">
          <PostsGrid userId={userId} saved />
        </TabsContent>
      )}
    </Tabs>
  );
}
