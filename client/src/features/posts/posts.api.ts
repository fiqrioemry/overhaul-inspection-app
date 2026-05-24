import qs from "qs";
import api from "@/lib/axios";
import type { Post } from "@/types/posts.type";
import { POST_ENDPOINTS } from "@/constants/posts.constant";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { CreatePostRequest, GetPublicPostsRequest, GetSavedPostsRequest, ReportPostRequest, UpdatePostRequest } from "@/schemas/posts.schema";

export async function fetchPublicPosts(query: GetPublicPostsRequest) {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${POST_ENDPOINTS.publicPosts}?${queryString}`);
  return res.data;
}

export async function fetchFollowingPosts(query: GetPublicPostsRequest): Promise<ResponseSuccess<Post>> {
  const res = await api.get(POST_ENDPOINTS.followingPosts, { params: query });
  return res.data;
}

export async function fetchPostById(postId: string): Promise<ResponseSuccess<Post>> {
  const res = await api.get(POST_ENDPOINTS.getPostDetails.replace(":postId", postId));
  return res.data;
}

export async function createPost(payload: CreatePostRequest): Promise<ResponseSuccess<Post>> {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("content", payload.content);
  formData.append("aspectRatio", payload.aspectRatio);

  // Kirim crops sebagai JSON string — server parse kembali ke array
  formData.append("crops", JSON.stringify(payload.crops ?? []));

  payload.galleries.forEach((file) => {
    formData.append("galleries", file);
  });

  const res = await api.post(POST_ENDPOINTS.createPost, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function updatePost(postId: string, payload: UpdatePostRequest): Promise<ResponseOK> {
  const res = await api.put(POST_ENDPOINTS.updatePost.replace(":postId", postId), payload);
  return res.data;
}

export async function likePost(postId: string): Promise<ResponseOK> {
  const res = await api.post(POST_ENDPOINTS.likePost.replace(":postId", postId));
  return res.data;
}

export async function unlikePost(postId: string): Promise<ResponseOK> {
  const res = await api.post(POST_ENDPOINTS.unlikePost.replace(":postId", postId));
  return res.data;
}

export async function fetchPostsByUserId(query: GetPublicPostsRequest): Promise<ResponseSuccess<Post>> {
  const res = await api.get(POST_ENDPOINTS.getUserPosts.replace(":userId", query.userId ?? ""), { params: query });
  return res.data;
}

export async function deletePost(postId: string): Promise<ResponseOK> {
  const res = await api.delete(POST_ENDPOINTS.updatePost.replace(":postId", postId));
  return res.data;
}

export async function fetchSavedPostsByUserId(query: GetSavedPostsRequest): Promise<ResponseSuccess<Post>> {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${POST_ENDPOINTS.getUserSavedPosts}?${queryString}`);
  return res.data;
}

export async function savePost(postId: string): Promise<ResponseOK> {
  const res = await api.post(POST_ENDPOINTS.savePost.replace(":postId", postId));
  return res.data;
}

export async function unsavePost(postId: string): Promise<ResponseOK> {
  const res = await api.post(POST_ENDPOINTS.unsavePost.replace(":postId", postId));
  return res.data;
}

export async function reportPost(postId: string, payload: ReportPostRequest): Promise<ResponseOK> {
  const res = await api.post(POST_ENDPOINTS.reportPost.replace(":postId", postId), payload);
  return res.data;
}
