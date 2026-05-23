import { z } from "zod";

const updateProfileRequest = z.object({
  userId: z.cuid().optional(),
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
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
  targetUserId: z.cuid({ message: "Target user ID is required" }),
});
export type FollowUserRequest = z.infer<typeof followUserRequest>;

// Accept or reject uses the follower's userId (the requestor)
const respondFollowRequest = z.object({
  userId: z.cuid().optional(), // injected: the account owner (current user)
  followerId: z.cuid({ message: "Follower ID is required" }),
});
export type RespondFollowRequest = z.infer<typeof respondFollowRequest>;

const getFollowRequestsQuery = z.object({
  userId: z.string().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("20").optional(),
});
export type GetFollowRequestsQuery = z.infer<typeof getFollowRequestsQuery>;

const updatePrivacyRequest = z.object({
  userId: z.cuid().optional(),
  isPublic: z.boolean(),
});
export type UpdatePrivacyRequest = z.infer<typeof updatePrivacyRequest>;

export { updateProfileRequest, updatePrivacyRequest, createUserActivityLogRequest, followUserRequest, respondFollowRequest, getFollowRequestsQuery, getFollowRequest };
