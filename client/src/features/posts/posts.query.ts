import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { CreatePostRequest, GetPublicPostsRequest, GetSavedPostsRequest, ReportPostRequest, SharePostRequest, UpdatePostRequest } from "@/schemas/posts.schema";
import { fetchPublicPosts, fetchFollowingPosts, fetchPostById, createPost, updatePost, deletePost, likePost, unlikePost, fetchPostsByUserId, fetchSavedPostsByUserId, savePost, unsavePost, reportPost, sharePost, unsharePost, fetchPostShares } from "./posts.api";

export const POST_KEYS = {
  all: ["posts"] as const,
  public: (params?: GetPublicPostsRequest) => ["posts", "public", params] as const,
  following: (params?: GetPublicPostsRequest) => ["posts", "following", params] as const,
  detail: (postId: string) => ["posts", "detail", postId] as const,
  byUser: (userId: string, params?: GetPublicPostsRequest) => ["posts", "user", userId, params] as const,
  saved: (userId: string, params?: GetSavedPostsRequest) => ["posts", "saved", userId, params] as const,
  shares: (postId: string) => ["posts", "shares", postId] as const,
};

export function usePostById(postId: string) {
  return useQuery({
    queryKey: POST_KEYS.detail(postId),
    queryFn: () => fetchPostById(postId),
    enabled: !!postId,
    staleTime: 1000 * 60,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostRequest) => createPost(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Post created successfully!");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useLikePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => likePost(postId),
    onSuccess: (res) => {
      toast.success(res.message || "You Liked the post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["hashtags"] });
    },
  });
}
export function useUnlikePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlikePost(postId),
    onSuccess: (res) => {
      toast.success(res.message || "You Unliked the post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["hashtags"] });
    },
  });
}

export function useUpdatePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePostRequest) => updatePost(postId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "You edited this post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.detail(postId) });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useDeletePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: (res) => {
      toast.success(res.message || "You deleted this post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.detail(postId) });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useInfiniteFollowingPosts(params: Omit<GetPublicPostsRequest, "page"> = { limit: 3 }) {
  return useInfiniteQuery({
    queryKey: POST_KEYS.following(params),
    queryFn: ({ pageParam = 1 }) => fetchFollowingPosts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 9));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

export function useInfinitePublicPosts(params: Omit<GetPublicPostsRequest, "page"> = { limit: 9 }) {
  return useInfiniteQuery({
    queryKey: POST_KEYS.public(params),
    queryFn: ({ pageParam = 1 }) => fetchPublicPosts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 9));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

export function useInfiniteUserPosts(params: Omit<GetPublicPostsRequest, "page"> = { limit: 3 }) {
  return useInfiniteQuery({
    queryKey: POST_KEYS.byUser(params.userId ?? "", params),

    queryFn: ({ pageParam = 1 }) => fetchPostsByUserId({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 9));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

export function useInfiniteSavedPosts(params: Omit<GetSavedPostsRequest, "page"> = { limit: 3 }, saved: boolean = false) {
  return useInfiniteQuery({
    queryKey: POST_KEYS.saved(params.userId ?? "", params),
    enabled: saved,
    queryFn: ({ pageParam = 1 }) => fetchSavedPostsByUserId({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 9));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

export function useUnsavePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unsavePost(postId),
    onSuccess: (res) => {
      toast.success(res.message || "You Unsaved the post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["hashtags"] });
    },
  });
}

export function useSavePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => savePost(postId),
    onSuccess: (res) => {
      toast.success(res.message || "You Saved the post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["hashtags"] });
    },
  });
}

export function useReportPost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportPostRequest) => reportPost(postId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "You reported the post");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useSharePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SharePostRequest) => sharePost(postId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Post shared successfully");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.shares(postId) });
    },
  });
}

export function useUnsharePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unsharePost(postId),
    onSuccess: (res) => {
      toast.success(res.message || "Repost removed");
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.shares(postId) });
    },
  });
}

export function usePostShares(postId: string, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: POST_KEYS.shares(postId),
    queryFn: () => fetchPostShares(postId, params),
    enabled: !!postId,
    staleTime: 1000 * 30,
  });
}
