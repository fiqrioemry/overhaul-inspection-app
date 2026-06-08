import { toast } from "sonner";
import i18n from "@/i18n";
import { POST_KEYS } from "@/features/posts/posts.query";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment, editComment, fetchComments, fetchReplies, likeComment, unlikeComment } from "./comments.api";
import { type CreateCommentRequest, type EditCommentRequest, type GetCommentsRequest } from "@/schemas/comments.schema";

export const COMMENT_KEYS = {
  all: ["comments"] as const,
  list: (postId: string) => [...COMMENT_KEYS.all, "list", postId] as const,
  replies: (commentId: string) => [...COMMENT_KEYS.all, "replies", commentId] as const,
  detail: (commentId: string) => [...COMMENT_KEYS.all, "detail", commentId] as const,
};

export function useComments(params: GetCommentsRequest) {
  return useInfiniteQuery({
    queryKey: COMMENT_KEYS.list(params.postId!),
    queryFn: ({ pageParam = 1 }) => fetchComments({ ...params, page: pageParam }),
    enabled: !!params.postId,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 9));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

export function useReplies(params: GetCommentsRequest) {
  return useInfiniteQuery({
    queryKey: COMMENT_KEYS.replies(params.commentId!),
    queryFn: ({ pageParam = 1 }) => fetchReplies({ ...params, page: pageParam }),
    enabled: !!params.commentId,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 9));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
  });
}

export function useLikeComment(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => likeComment(commentId),
    onSuccess: () => {
      toast.success(i18n.t("api:LIKE_COMMENT_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.detail(commentId) });
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.all });
    },
  });
}

export function useUnlikeComment(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlikeComment(commentId),
    onSuccess: () => {
      toast.success(i18n.t("api:UNLIKE_COMMENT_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.detail(commentId) });
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.all });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommentRequest) => createComment(payload),
    onSuccess: () => {
      toast.success(i18n.t("api:CREATE_COMMENT_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useEditComment(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EditCommentRequest) => editComment(commentId, payload),
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_COMMENT_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.detail(commentId) });
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.all });
    },
  });
}

export function useDeleteComment(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteComment(commentId),
    onSuccess: () => {
      toast.success(i18n.t("api:DELETE_COMMENT_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}
