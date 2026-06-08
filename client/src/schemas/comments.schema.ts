import { z } from "zod";
import i18n from "@/i18n";

const t = (key: string): string => i18n.t(`validation:${key}`);

export const createCommentRequest = () =>
  z.object({
    userId: z.cuid().optional(),
    commentId: z.cuid().optional(),
    postId: z.cuid().optional(),
    content: z.string().min(1, t("contentRequired")),
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

export const editCommentRequest = () => createCommentRequest().partial();

export type CreateCommentRequest = z.infer<ReturnType<typeof createCommentRequest>>;
export type GetCommentsRequest = z.infer<typeof getCommentsRequest>;
export type EditCommentRequest = z.infer<ReturnType<typeof editCommentRequest>>;
