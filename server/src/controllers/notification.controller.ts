import { Context } from "hono";
import { responseOK } from "@/utils/response";
import { NotificationService } from "@/services/notification.service";
import { notificationSuccessMessage } from "@/config/constant/notification.constant";
import { deleteNotificationRequest, getNotificationRequest, updateNotificationRequest, updateNotificationSettingRequest } from "@/schema/notification.validation";

export class NotificationController {
  static async getUserNotifications(c: Context) {
    const user = c.get("user");
    const query = getNotificationRequest.parse(c.req.query());
    query.userId = user?.userId;
    const response = await NotificationService.getNotificationByUserId(c, query);
    return responseOK(c, notificationSuccessMessage.GET_NOTIFICATIONS, response.data, response.meta);
  }

  static async markAsRead(c: Context) {
    const user = c.get("user");
    const request = updateNotificationRequest.parse(await c.req.json());
    request.userId = user?.userId;
    await NotificationService.markAsRead(c, request);
    return responseOK(c, notificationSuccessMessage.MARK_AS_READ);
  }

  static async deleteNotification(c: Context) {
    const user = c.get("user");
    const payload = deleteNotificationRequest.parse(await c.req.json());
    payload.userId = user?.userId;
    await NotificationService.deleteNotification(c, payload);
    return responseOK(c, notificationSuccessMessage.DELETE_NOTIFICATION);
  }

  static async getNotificationSettings(c: Context) {
    const user = c.get("user");
    const response = await NotificationService.getNotificationSettings(c, user?.userId!);
    return responseOK(c, notificationSuccessMessage.GET_NOTIFICATION_SETTINGS, response);
  }

  static async updateNotificationSettings(c: Context) {
    const user = c.get("user");
    const request = updateNotificationSettingRequest.parse(await c.req.json());
    request.userId = user?.userId;
    await NotificationService.updateNotificationSettings(c, request);
    return responseOK(c, notificationSuccessMessage.UPDATE_NOTIFICATION_SETTINGS);
  }
}
