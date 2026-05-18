import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Notification, NotificationSetting } from "./notifications.type";
import { UserRepository } from "@/modules/users/user.repository";
import { notificationAction } from "@/config/constant/notification.constant";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { DeleteNotificationRequest, GetNotificationRequest, UpdateNotificationRequest, UpdateNotificationSettingRequest } from "@/modules/notifications/notification.schema";

export class NotificationService {
  static async getUnreadNotificationCount(c: Context, userId: string) {
    return await NotificationRepository.countUnreadNotifications(userId);
  }

  static async getNotificationByUserId(c: Context, request: GetNotificationRequest) {
    const { notifications, totalItems } = await NotificationRepository.getNotificationsByUserId(request);

    const data = notifications.map((notification: Notification) => ({
      id: notification.id,
      title: notification.title,
      description: notification.description,
      type: notification.type,
      metadata: notification.metadata,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    }));

    const meta = {
      pagination: {
        page: Number(request.page!),
        limit: Number(request.limit!),
        totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / Number(request.limit!)) : 0,
      },
      filter: {
        search: request.search,
        type: request.type,
        orderBy: request.orderBy,
        sortBy: request.sortBy,
      },
    };

    return { data, meta };
  }

  static async markAsRead(c: Context, payload: UpdateNotificationRequest) {
    await NotificationRepository.markAsRead(payload.userId!, payload.notificationIds, new Date());
  }

  static async getNotificationSettings(c: Context, userId: string) {
    const notifications = await NotificationRepository.getNotificationSettings(userId);
    return notifications.map((setting: NotificationSetting) => ({
      id: setting.id,
      type: setting.type,
      channel: setting.channel,
      status: setting.status,
    }));
  }

  static async updateNotificationSettings(c: Context, payload: UpdateNotificationSettingRequest) {
    await pgsql.$transaction(async (tx) => {
      await NotificationRepository.updateNotificationSettings(tx, payload);

      const userLogs = {
        userId: payload.userId!,
        action: notificationAction.UPDATE_NOTIFICATION_SETTINGS,
        metadata: { status: payload.status },
      };
      await UserRepository.createActivityLog(tx, userLogs);
    });
  }

  static async deleteNotification(c: Context, payload: DeleteNotificationRequest) {
    await pgsql.$transaction(async (tx) => {
      await NotificationRepository.deleteNotification(tx, payload);

      const userLogs = {
        userId: payload.userId!,
        action: notificationAction.DELETE_NOTIFICATION,
        metadata: { notificationIds: payload.notificationIds },
      };
      await UserRepository.createActivityLog(tx, userLogs);
    });
  }
}
