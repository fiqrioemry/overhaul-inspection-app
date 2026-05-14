import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/config/database/pgsql";
import { NotificationChannel, NotificationStatus, NotificationType } from "generated/prisma";
import { DeleteNotificationRequest, GetNotificationRequest, UpdateNotificationSettingRequest } from "@/modules/notifications/notification.schema";

export class NotificationRepository {
  static async getNotificationsByUserId(query: GetNotificationRequest) {
    const { userId, type, sortBy, orderBy, search, page = 1, limit = 10 } = query;
    let where: any = {
      userId: userId!,
      description: { contains: search, mode: "insensitive" } as const,
    };

    if (type) {
      where = { ...where, type };
    }

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
        orderBy: {
          [orderBy!]: sortBy!,
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      database.notification.count({ where }),
    ]);

    return { notifications, totalItems };
  }
  static async createNotification(tx: Prisma.TransactionClient, data: { userId: string; title: string; description: string; type: NotificationType; metadata: Record<string, any> }) {
    const db = tx ?? database;
    await db.notification.create({
      data,
    });
  }

  static async markAsRead(userId: string, notificationIds: string[], readAt: Date) {
    await database.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { readAt },
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

  static async getNotificationByType(userId: string, type: NotificationType) {
    return await database.notificationSetting.findFirst({
      where: { userId, type },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });
  }

  static async updateNotificationSettings(tx: Prisma.TransactionClient, payload: UpdateNotificationSettingRequest) {
    const db = tx ?? database;
    await db.notificationSetting.update({
      where: { id: payload.notificationId },
      data: { status: payload.status },
    });
  }

  static async deleteNotification(tx: Prisma.TransactionClient, payload: DeleteNotificationRequest) {
    const db = tx ?? database;
    await db.notification.deleteMany({
      where: { userId: payload.userId, id: { in: payload.notificationIds } },
    });
  }
}
