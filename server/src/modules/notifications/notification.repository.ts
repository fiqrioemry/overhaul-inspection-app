import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/lib/database";
import { NotificationChannel, NotificationStatus, NotificationType } from "generated/prisma";
import { CreateNotificationRequest, GetNotificationRequest, UpdateNotificationSettingRequest } from "@/modules/notifications/notification.schema";

export class NotificationRepository {
  static async countUnreadNotifications(userId: string) {
    return await database.notification.count({
      where: {
        userId,
        readAt: null,
        deletedAt: null,
      },
    });
  }

  static async getNotificationsByUserId(query: GetNotificationRequest) {
    const { userId, type, sortBy, orderBy, search, page = 1, limit = 10 } = query;

    const where: Prisma.NotificationWhereInput = {
      userId: userId!,
      deletedAt: null,
      ...(search && { description: { contains: search, mode: "insensitive" } }),
      ...(type && { type }),
    };

    const [notifications, totalItems] = await Promise.all([
      database.notification.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          metadata: true,
          readAt: true,
          createdAt: true,
        },
        orderBy: { [orderBy!]: sortBy! },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      database.notification.count({ where }),
    ]);

    return { notifications, totalItems };
  }

  static async findById(id: string, userId: string) {
    return await database.notification.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, userId: true, readAt: true },
    });
  }

  static async createNotification(
    tx: Prisma.TransactionClient | null,
    data: CreateNotificationRequest,
  ) {
    const db = tx ?? database;
    return await db.notification.create({ data });
  }

  static async markAsRead(notificationId: string, userId: string, readAt: Date) {
    await database.notification.update({
      where: { id: notificationId, userId },
      data: { readAt },
    });
  }

  static async markAllAsRead(userId: string, readAt: Date) {
    await database.notification.updateMany({
      where: { userId, readAt: null, deletedAt: null },
      data: { readAt },
    });
  }

  static async softDelete(id: string, userId: string) {
    await database.notification.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }

  static async createNotificationSettings(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      type: NotificationType;
      channel: NotificationChannel;
      status: NotificationStatus;
    }[],
  ) {
    const db = tx ?? database;
    await db.notificationSetting.createMany({
      data,
      skipDuplicates: true,
    });
  }

  static async getNotificationSettings(userId: string) {
    return await database.notificationSetting.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        channel: true,
        status: true,
      },
    });
  }

  static async getNotificationSettingByTypeAndChannel(userId: string, type: NotificationType, channel: NotificationChannel) {
    return await database.notificationSetting.findFirst({
      where: { userId, type, channel },
      select: { id: true, userId: true, status: true },
    });
  }

  static async updateNotificationSettings(tx: Prisma.TransactionClient, payload: UpdateNotificationSettingRequest) {
    const db = tx ?? database;
    await db.notificationSetting.update({
      where: { id: payload.notificationId },
      data: { status: payload.status },
    });
  }
}
