import { z } from "zod";
import { PostReportReason } from "generated/prisma";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const postFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_FILE_SIZE, "File size must be less than 8MB")
  .refine((f) => ALLOWED_TYPES.includes(f.type), "Only JPEG, PNG, and WebP are allowed");

export const aspectRatioSchema = z.enum(["1:1", "4:5", "1.91:1", "16:9"]).default("1:1");

export const cropDataSchema = z.object({
  cropX: z.number().min(0).max(1),
  cropY: z.number().min(0).max(1),
  cropW: z.number().min(0).max(1),
  cropH: z.number().min(0).max(1),
});

export const createPostRequest = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(5, "Content is required min 5 characters"),
  galleries: z.array(postFileSchema).min(1, "At least one image is required").max(10, "Maximum 10 images"),
  aspectRatio: aspectRatioSchema,
  crops: z.array(cropDataSchema).optional().default([]),
});

export type CreatePostRequest = z.infer<typeof createPostRequest>;
export type CropData = z.infer<typeof cropDataSchema>;

export const updatePostRequest = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content is required min 10 characters"),
});

export type UpdatePostRequest = z.infer<typeof updatePostRequest>;

export const getSavedPostsRequest = z.object({
  userId: z.cuid().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("10").optional(),
  orderBy: z.enum(["createdAt"]).optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
});

export type GetSavedPostsRequest = z.infer<typeof getSavedPostsRequest>;

export const getPublicPostsRequest = z.object({
  userId: z.cuid().optional(),
  targetUserId: z.cuid().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("10").optional(),
  orderBy: z.enum(["createdAt"]).optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
});

export type GetPublicPostsRequest = z.infer<typeof getPublicPostsRequest>;

export const getFollowingPostsRequest = z.object({
  userId: z.cuid().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("10").optional(),
  orderBy: z.enum(["createdAt"]).optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
});

export type GetFollowingPostsRequest = z.infer<typeof getFollowingPostsRequest>;

export const reportPostRequest = z
  .object({
    reason: z.nativeEnum(PostReportReason),
    description: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reason === PostReportReason.OTHER && !data.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Description is required when reason is OTHER.",
      });
    }
  });

export type ReportPostRequest = z.infer<typeof reportPostRequest>;
