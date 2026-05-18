import qs from "qs";
import api from "@/lib/axios";
import type { Comments } from "@/types/comments.type";
import { COMMENTS_ENDPOINTS } from "@/constants/comments.constant";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { CreateCommentRequest, EditCommentRequest, GetCommentsRequest } from "@/schemas/comments.schema";

export async function fetchComments(query: GetCommentsRequest): Promise<ResponseSuccess<Comments[]>> {
  const queryStrings = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${COMMENTS_ENDPOINTS.getComments.replace(":postId", query.postId ?? "")}?${queryStrings}`);
  return res.data;
}

export async function fetchReplies(query: GetCommentsRequest): Promise<ResponseSuccess<Comments[]>> {
  const queryStrings = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${COMMENTS_ENDPOINTS.getReplies.replace(":postId", query.postId ?? "").replace(":commentId", query.commentId ?? "")}?${queryStrings}`);
  return res.data;
}

export async function createComment(payload: CreateCommentRequest): Promise<ResponseOK> {
  const res = await api.post(COMMENTS_ENDPOINTS.createComment, payload);
  return res.data;
}

export async function editComment(commentId: string, payload: EditCommentRequest): Promise<ResponseOK> {
  const res = await api.put(COMMENTS_ENDPOINTS.editComment.replace(":commentId", commentId), payload);
  return res.data;
}

export async function likeComment(commentId: string): Promise<ResponseOK> {
  const res = await api.post(COMMENTS_ENDPOINTS.likeComment.replace(":commentId", commentId));
  return res.data;
}

export async function unlikeComment(commentId: string): Promise<ResponseOK> {
  const res = await api.delete(COMMENTS_ENDPOINTS.unlikeComment.replace(":commentId", commentId));
  return res.data;
}
