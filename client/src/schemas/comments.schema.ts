import { z } from "zod";

export const createCommentRequest = z.object({
  userId: z.cuid().optional(),
  commentId: z.cuid().optional(),
  postId: z.cuid().optional(),
  content: z.string().min(1, "Content is required"),
});

export const getCommentsRequest = z.object({
  userId: z.cuid().optional(),
  postId: z.cuid().optional(),
  commentId: z.cuid().optional(),
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  orderBy: z.enum(["createdAt"]).optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
});

export const editCommentRequest = createCommentRequest.partial();

export type CreateCommentRequest = z.infer<typeof createCommentRequest>;
export type GetCommentsRequest = z.infer<typeof getCommentsRequest>;
export type EditCommentRequest = z.infer<typeof editCommentRequest>;
