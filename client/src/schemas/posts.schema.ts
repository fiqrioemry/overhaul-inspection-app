import { z } from "zod";
import i18n from "@/i18n";

const t = (key: string, opts?: Record<string, unknown>): string =>
  opts !== undefined ? i18n.t(`validation:${key}`, opts) : i18n.t(`validation:${key}`);

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const imageFileSchema = () =>
  z
    .instanceof(File)
    .refine((f) => f.size <= MAX_FILE_SIZE, t("fileSizeMax"))
    .refine((f) => ALLOWED_TYPES.includes(f.type), t("fileTypeInvalid"));

export const aspectRatioSchema = z.enum(["1:1", "4:5", "1.91:1", "16:9"]);

export const cropDataSchema = z.object({
  cropX: z.number().min(0).max(1),
  cropY: z.number().min(0).max(1),
  cropW: z.number().min(0).max(1),
  cropH: z.number().min(0).max(1),
});

export const createPostRequest = () =>
  z.object({
    title: z.string().min(1, t("titleRequired")),
    content: z.string().min(10, t("contentMin", { count: 10 })).max(2000, t("contentMax", { count: 2000 })),
    galleries: z.array(imageFileSchema()).min(1, t("imagesMin")).max(5, t("imagesMax", { count: 5 })),
    aspectRatio: aspectRatioSchema,
    crops: z.array(cropDataSchema),
  });

export type CreatePostRequest = z.infer<ReturnType<typeof createPostRequest>>;
export type CropData = z.infer<typeof cropDataSchema>;

export const updatePostRequest = () =>
  z.object({
    title: z.string().min(1, t("titleRequired")),
    content: z.string().min(10, t("contentMin", { count: 10 })).max(2000, t("contentMax", { count: 2000 })),
  });

export type UpdatePostRequest = z.infer<ReturnType<typeof updatePostRequest>>;

export const getPublicPostsRequest = z.object({
  userId: z.cuid().optional(),
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  orderBy: z.enum(["createdAt"]).default("createdAt").optional(),
  sortBy: z.enum(["asc", "desc"]).default("desc").optional(),
});

export type GetPublicPostsRequest = z.infer<typeof getPublicPostsRequest>;

export const getFollowingPostsRequest = z.object({
  userId: z.cuid().optional(),
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  orderBy: z.enum(["createdAt"]).default("createdAt").optional(),
  sortBy: z.enum(["asc", "desc"]).default("desc").optional(),
});

export type GetFollowingPostsRequest = z.infer<typeof getFollowingPostsRequest>;

export const getSavedPostsRequest = z.object({
  userId: z.cuid().optional(),
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  orderBy: z.enum(["createdAt"]).optional(),
  sortBy: z.enum(["asc", "desc"]).optional(),
});

export type GetSavedPostsRequest = z.infer<typeof getSavedPostsRequest>;

const PostReportReason = z.enum(["SPAM", "NUDITY", "MISSINFORMATION", "INAPPROPRIATE", "HARASSMENT", "OTHER"]);

export const reportPostRequest = () =>
  z
    .object({
      reason: PostReportReason,
      description: z.string().max(1000).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.reason === PostReportReason.enum.OTHER && !data.description?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description"],
          message: t("reportDescriptionRequired"),
        });
      }
    });

export type ReportPostRequest = z.infer<ReturnType<typeof reportPostRequest>>;

export const sharePostRequest = z.object({
  caption: z.string().max(500).optional(),
});

export type SharePostRequest = z.infer<typeof sharePostRequest>;
