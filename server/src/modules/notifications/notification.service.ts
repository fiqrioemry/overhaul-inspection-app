import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { HTTPException } from "hono/http-exception";
import { NotificationChannel } from "generated/prisma";
import { UserRepository } from "@/modules/users/user.repository";
import { notificationAction } from "@/config/constant/notification.constant";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { CreateNotificationRequest, GetNotificationRequest, UpdateNotificationSettingRequest } from "@/modules/notifications/notification.schema";

export class NotificationService {
  static async getUnreadNotificationCount(c: Context, userId: string) {
    return await NotificationRepository.countUnreadNotifications(userId);
  }

  static async getNotifications(c: Context, request: GetNotificationRequest) {
    const { notifications, totalItems } = await NotificationRepository.getNotificationsByUserId(request);

    return {
      data: notifications,
      meta: {
        page: Number(request.page),
        limit: Number(request.limit),
        total: totalItems,
        totalPages: totalItems > 0 ? Math.ceil(totalItems / Number(request.limit)) : 0,
      },
    };
  }

  static async markAsRead(c: Context, notificationId: string, userId: string) {
    const notification = await NotificationRepository.findById(notificationId, userId);
    if (!notification) {
      throw new HTTPException(404, { message: "Notification not found", cause: "NOTIFICATION_NOT_FOUND" });
    }
    await NotificationRepository.markAsRead(notificationId, userId, new Date());
  }

  static async markAllAsRead(c: Context, userId: string) {
    await NotificationRepository.markAllAsRead(userId, new Date());
  }

  static async deleteNotification(c: Context, notificationId: string, userId: string) {
    const notification = await NotificationRepository.findById(notificationId, userId);
    if (!notification) {
      throw new HTTPException(404, { message: "Notification not found", cause: "NOTIFICATION_NOT_FOUND" });
    }
    await NotificationRepository.softDelete(notificationId, userId);
  }

  static async getNotificationSettings(c: Context, userId: string) {
    return await NotificationRepository.getNotificationSettings(userId);
  }

  static async updateNotificationSettings(c: Context, payload: UpdateNotificationSettingRequest) {
    await pgsql.$transaction(async (tx) => {
      await NotificationRepository.updateNotificationSettings(tx, payload);

      await UserRepository.createActivityLog(tx, {
        userId: payload.userId!,
        action: notificationAction.UPDATE_NOTIFICATION_SETTINGS,
        metadata: { status: payload.status },
      });
    });
  }

  /**
   * Creates an in-app notification and optionally an email notification based on user settings.
   * Designed to be called from any feature module (tanks, findings, inspection requests, etc.)
   */
  static async createNotificationForUser(data: CreateNotificationRequest) {
    const setting = await NotificationRepository.getNotificationSettingByTypeAndChannel(
      data.userId,
      data.type,
      NotificationChannel.IN_APP,
    );

    // Always create in-app notification unless explicitly disabled
    if (!setting || setting.status === "ENABLED") {
      await NotificationRepository.createNotification(null, data);
    }

    // Email notification — check email channel setting
    const emailSetting = await NotificationRepository.getNotificationSettingByTypeAndChannel(
      data.userId,
      data.type,
      NotificationChannel.EMAIL,
    );

    if (emailSetting?.status === "ENABLED") {
      // Future: queue email via nodemailer
    }
  }
}
