import { z } from "zod";

export const getHashtagPostsQuery = z.object({
  userId: z.cuid().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("10").optional(),
});
export type GetHashtagPostsQuery = z.infer<typeof getHashtagPostsQuery>;

export const getTrendingQuery = z.object({
  limit: z.string().default("20").optional(),
});
export type GetTrendingQuery = z.infer<typeof getTrendingQuery>;
