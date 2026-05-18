import { z } from "zod";

const searchUsersRequest = z.object({
  userId: z.cuid().optional(),
  targetUserId: z.cuid().optional(),
  search: z.string().min(1, "Search query is required"),
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  orderBy: z.enum(["createdAt"]).default("createdAt").optional(),
  sortBy: z.enum(["asc", "desc"]).default("desc").optional(),
});
export type SearchUsersRequest = z.infer<typeof searchUsersRequest>;

const updateProfileRequest = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

export { updateProfileRequest, searchUsersRequest };
