import { z } from "zod";

export const getReportsQuery = z.object({
  page: z.string().default("1").optional(),
  limit: z.string().default("20").optional(),
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]).optional(),
  reason: z.string().optional(),
});
export type GetReportsQuery = z.infer<typeof getReportsQuery>;

export const updateReportRequest = z.object({
  status: z.enum(["REVIEWED", "RESOLVED", "DISMISSED"]),
  actionTaken: z.string().max(200).optional(),
});
export type UpdateReportRequest = z.infer<typeof updateReportRequest>;

export const getAdminUsersQuery = z.object({
  page: z.string().default("1").optional(),
  limit: z.string().default("20").optional(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});
export type GetAdminUsersQuery = z.infer<typeof getAdminUsersQuery>;

export const updateUserStatusRequest = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
});
export type UpdateUserStatusRequest = z.infer<typeof updateUserStatusRequest>;
