import { RoleEnum } from "generated/prisma";
import { z } from "zod";

const updateProfileRequest = z.object({
  userId: z.cuid().optional(),
  name: z.string().min(1, "Name is required"),
  role: z.enum(RoleEnum).optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

const createUserActivityLogRequest = z.object({
  userId: z.string(),
  action: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateUserActivityLogRequest = z.infer<typeof createUserActivityLogRequest>;

const paginatedQuery = z.object({
  userId: z.string().optional(),
  page: z.string().default("1").optional(),
  limit: z.string().default("20").optional(),
});
export type PaginatedQuery = z.infer<typeof paginatedQuery>;

export { updateProfileRequest, createUserActivityLogRequest, paginatedQuery };
