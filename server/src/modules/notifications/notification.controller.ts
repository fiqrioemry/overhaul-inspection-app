import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { NotificationService } from "@/modules/notifications/notification.service";
import { notificationSuccessMessage } from "@/config/constant/notification.constant";
import { getNotificationRequest, updateNotificationSettingRequest } from "@/modules/notifications/notification.schema";

export class NotificationController {
  static async getUnreadCount(c: Context) {
    const user = c.get("user");
    const response = await NotificationService.getUnreadNotificationCount(c, user.userId);
    return responseOK(c, notificationSuccessMessage.GET_UNREAD_COUNT, { unreadCount: response });
  }

  static async getNotifications(c: Context) {
    const user = c.get("user");
    const query = getNotificationRequest.parse(c.req.query());
    query.userId = user.userId;
    const response = await NotificationService.getNotifications(c, query);
    return responseOK(c, notificationSuccessMessage.GET_NOTIFICATIONS, response.data, response.meta);
  }

  static async markAsRead(c: Context) {
    const user = c.get("user");
    const notificationId = c.req.param("id");
    await NotificationService.markAsRead(c, notificationId, user.userId);
    return responseOK(c, notificationSuccessMessage.MARK_AS_READ);
  }

  static async markAllAsRead(c: Context) {
    const user = c.get("user");
    await NotificationService.markAllAsRead(c, user.userId);
    return responseOK(c, notificationSuccessMessage.MARK_AS_READ);
  }

  static async deleteNotification(c: Context) {
    const user = c.get("user");
    const notificationId = c.req.param("id");
    await NotificationService.deleteNotification(c, notificationId, user.userId);
    return responseOK(c, notificationSuccessMessage.DELETE_NOTIFICATION);
  }

  static async getNotificationSettings(c: Context) {
    const user = c.get("user");
    const response = await NotificationService.getNotificationSettings(c, user.userId);
    return responseOK(c, notificationSuccessMessage.GET_NOTIFICATION_SETTINGS, response);
  }

  static async updateNotificationSettings(c: Context) {
    const user = c.get("user");
    const request = updateNotificationSettingRequest.parse(await c.req.json());
    request.userId = user.userId;
    await NotificationService.updateNotificationSettings(c, request);
    return responseOK(c, notificationSuccessMessage.UPDATE_NOTIFICATION_SETTINGS);
  }
}
