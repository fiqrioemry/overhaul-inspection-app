import { array, z } from "zod";
import { NotificationStatus, NotificationType } from "generated/prisma";

export const getNotificationRequest = z.object({
  userId: z.cuid().optional(),
  search: z.string().optional(),
  limit: z.string().default("10").optional(),
  page: z.string().default("1").optional(),
  type: z.enum(NotificationType).optional(),
  orderBy: z.enum(["createdAt"]).default("createdAt").optional(),
  sortBy: z.enum(["asc", "desc"]).default("asc").optional(),
});

export type GetNotificationRequest = z.infer<typeof getNotificationRequest>;

export const updateNotificationSettingRequest = z.object({
  userId: z.cuid().optional(),
  notificationId: z.cuid().min(1, "Notification ID is required"),
  status: z.enum(NotificationStatus),
});

export type UpdateNotificationSettingRequest = z.infer<typeof updateNotificationSettingRequest>;

export const updateNotificationRequest = z.object({
  userId: z.cuid().optional(),
  notificationIds: array(z.cuid()),
  readAt: z.date().optional(),
});

export type UpdateNotificationRequest = z.infer<typeof updateNotificationRequest>;

export const deleteNotificationRequest = z.object({
  userId: z.cuid().optional(),
  notificationIds: array(z.cuid()),
});

export type DeleteNotificationRequest = z.infer<typeof deleteNotificationRequest>;
