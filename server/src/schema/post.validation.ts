import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
  .refine((f) => ALLOWED_TYPES.includes(f.type), "Only JPEG, PNG, and WebP are allowed");

export const createPostRequest = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content is required min 10 characters"),
  galleries: z.array(imageFileSchema).min(1, "At least one image is required").max(10, "Maximum 10 images"),
});

export type CreatePostRequest = z.infer<typeof createPostRequest>;

export const updatePostRequest = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content is required min 10 characters"),
});

export type UpdatePostRequest = z.infer<typeof updatePostRequest>;
