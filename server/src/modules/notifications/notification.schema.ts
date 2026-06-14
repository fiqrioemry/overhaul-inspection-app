import { z } from "zod";
import { NotificationStatus, NotificationType } from "generated/prisma";

export const getNotificationRequest = z.object({
  userId: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().default("10").transform(Number),
  page: z.string().default("1").transform(Number),
  type: z.enum(NotificationType).optional(),
  orderBy: z.enum(["createdAt"]).default("createdAt"),
  sortBy: z.enum(["asc", "desc"]).default("desc"),
});
export type GetNotificationRequest = z.infer<typeof getNotificationRequest>;

export const updateNotificationSettingRequest = z.object({
  userId: z.string().optional(),
  notificationId: z.string().min(1, "Notification setting ID is required"),
  status: z.enum(NotificationStatus),
});
export type UpdateNotificationSettingRequest = z.infer<typeof updateNotificationSettingRequest>;

export const markAsReadRequest = z.object({
  userId: z.string().optional(),
});
export type MarkAsReadRequest = z.infer<typeof markAsReadRequest>;

export const createNotificationRequest = z.object({
  userId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(NotificationType),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type CreateNotificationRequest = z.infer<typeof createNotificationRequest>;
