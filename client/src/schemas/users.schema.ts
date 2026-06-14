import { z } from "zod";
import i18n from "@/i18n";

const t = (key: string, opts?: Record<string, unknown>): string => (opts !== undefined ? i18n.t(`validation:${key}`, opts) : i18n.t(`validation:${key}`));

const searchUsersRequest = z.object({
  userId: z.cuid().optional(),
  targetUserId: z.cuid().optional(),
  search: z.string().min(1, t("searchRequired")),
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
  orderBy: z.enum(["createdAt"]).default("createdAt").optional(),
  sortBy: z.enum(["asc", "desc"]).default("desc").optional(),
});
export type SearchUsersRequest = z.infer<typeof searchUsersRequest>;

const updateProfileRequest = z.object({
  name: z.string().min(1, t("nameRequired")),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

export { updateProfileRequest, searchUsersRequest };
