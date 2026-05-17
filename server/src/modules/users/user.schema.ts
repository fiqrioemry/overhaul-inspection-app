import { z } from "zod";

const updateProfileRequest = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

const createUserActivityLogRequest = z.object({
  userId: z.string(),
  action: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const getFollowRequest = z.object({
  userId: z.string().optional(),
  targetUserId: z.string().min(1, "Target user ID is required").optional(),
  search: z.string().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("20").optional(),
});

export type GetFollowRequest = z.infer<typeof getFollowRequest>;

export type CreateUserActivityLogRequest = z.infer<typeof createUserActivityLogRequest>;

const followUserRequest = z.object({
  userId: z.cuid().optional(),
  targetUserId: z.cuid().min(1, "Target user ID is required"),
});

export type FollowUserRequest = z.infer<typeof followUserRequest>;

export { updateProfileRequest, createUserActivityLogRequest, followUserRequest, getFollowRequest };
