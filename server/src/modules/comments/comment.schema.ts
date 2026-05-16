import { z } from "zod";

export const createCommentRequest = z.object({
  userId: z.cuid().optional(),
  commentId: z.cuid().optional(),
  postId: z.cuid().min(1, "Post ID is required"),
  content: z.string().min(1, "Content is required"),
});

export type CreateCommentRequest = z.infer<typeof createCommentRequest>;

export const getCommentsRequest = z.object({
  userId: z.cuid().optional(),
  postId: z.cuid().optional(),
  commentId: z.cuid().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("10").optional(),
  orderBy: z.enum(["createdAt"]).optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
});

export type GetCommentsRequest = z.infer<typeof getCommentsRequest>;

export const editCommentRequest = createCommentRequest.partial();

export type EditCommentRequest = z.infer<typeof editCommentRequest>;
