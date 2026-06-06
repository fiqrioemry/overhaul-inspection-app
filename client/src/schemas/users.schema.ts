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
  website: z
    .string()
    .max(200, "Website URL must be at most 200 characters")
    .refine((v) => !v || /^https?:\/\/.+/.test(v), { message: "Website must be a valid URL" })
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-z0-9_.]+$/, "Username can only contain lowercase letters, numbers, dots, and underscores")
    .optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

export { updateProfileRequest, searchUsersRequest };
