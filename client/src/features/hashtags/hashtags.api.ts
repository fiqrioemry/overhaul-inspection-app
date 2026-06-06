// src/features/hashtags/hashtags.api.ts
import qs from "qs";
import api from "@/lib/axios";
import { HASHTAG_ENDPOINTS } from "@/constants/hashtags.constant";
import type { Hashtag, Post } from "@/types/posts.type";
import type { ResponseSuccess } from "@/types/response.type";

export async function fetchTrendingHashtags(limit = 20): Promise<ResponseSuccess<Hashtag[]>> {
  const res = await api.get(`${HASHTAG_ENDPOINTS.trending}?limit=${limit}`);
  return res.data;
}

export async function fetchHashtagPosts(name: string, params: { page?: number; limit?: number } = {}): Promise<ResponseSuccess<Post[]>> {
  const queryString = qs.stringify(params, { skipNulls: true });
  const res = await api.get(`${HASHTAG_ENDPOINTS.hashtagPosts.replace(":name", encodeURIComponent(name))}?${queryString}`);
  return res.data;
}
