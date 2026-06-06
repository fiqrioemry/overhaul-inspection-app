// src/features/hashtags/hashtags.query.ts
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { Post } from "@/types/posts.type";
import type { ResponseSuccess } from "@/types/response.type";
import { fetchTrendingHashtags, fetchHashtagPosts } from "./hashtags.api";

export const HASHTAG_KEYS = {
  all: ["hashtags"] as const,
  trending: (limit?: number) => ["hashtags", "trending", limit] as const,
  posts: (name: string) => ["hashtags", "posts", name] as const,
};

export function useTrendingHashtags(limit = 20) {
  return useQuery({
    queryKey: HASHTAG_KEYS.trending(limit),
    queryFn: () => fetchTrendingHashtags(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInfiniteHashtagPosts(name: string, limit = 12) {
  return useInfiniteQuery<ResponseSuccess<Post[]>, Error, InfiniteData<ResponseSuccess<Post[]>>, ReturnType<typeof HASHTAG_KEYS.posts>, number>({
    queryKey: HASHTAG_KEYS.posts(name),
    queryFn: ({ pageParam }) => fetchHashtagPosts(name, { page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!name,
    staleTime: 1000 * 60,
  });
}
