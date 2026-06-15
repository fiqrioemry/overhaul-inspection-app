import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { NotificationController as ctrl } from "@/modules/notifications/notification.controller";

const notif = new Hono();

notif.get("/unread-count", protect, requirePermission(PERMISSIONS.NOTIFICATION_READ), ctrl.getUnreadCount);
notif.get("/", protect, requirePermission(PERMISSIONS.NOTIFICATION_READ), ctrl.getNotifications);
notif.patch("/read-all", protect, requirePermission(PERMISSIONS.NOTIFICATION_UPDATE), ctrl.markAllAsRead);
notif.patch("/:id/read", protect, requirePermission(PERMISSIONS.NOTIFICATION_UPDATE), ctrl.markAsRead);
notif.delete("/:id", protect, requirePermission(PERMISSIONS.NOTIFICATION_READ), ctrl.deleteNotification);
notif.get("/settings", protect, requirePermission(PERMISSIONS.NOTIFICATION_READ), ctrl.getNotificationSettings);
notif.patch("/settings", protect, requirePermission(PERMISSIONS.NOTIFICATION_UPDATE), ctrl.updateNotificationSettings);

export default notif;
