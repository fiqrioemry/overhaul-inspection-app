import { z } from "zod";
import i18n from "@/i18n";

const t = (key: string, opts?: Record<string, unknown>): string =>
  opts !== undefined ? i18n.t(`validation:${key}`, opts) : i18n.t(`validation:${key}`);

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
  bio: z.string().max(160, t("bioMax", { count: 160 })).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  website: z
    .string()
    .max(200, t("websiteMax", { count: 200 }))
    .refine((v) => !v || /^https?:\/\/.+/.test(v), { message: t("websiteInvalid") })
    .optional(),
  username: z
    .string()
    .min(3, t("usernameMin", { count: 3 }))
    .max(30, t("usernameMax", { count: 30 }))
    .regex(/^[a-z0-9_.]+$/, t("usernamePattern"))
    .optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

export { updateProfileRequest, searchUsersRequest };
