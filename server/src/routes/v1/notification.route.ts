import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { NotificationController as ctrl } from "@/modules/notifications/notification.controller";

const notif = new Hono();

notif.get("/unread-count", protect, ctrl.getUnreadNotificationCount);
notif.get("/", protect, ctrl.getUserNotifications);
notif.get("/settings", protect, ctrl.getNotificationSettings);
notif.put("/settings", protect, ctrl.updateNotificationSettings);
notif.post("/read", protect, ctrl.markAsRead);
notif.delete("/delete", protect, ctrl.deleteNotification);

export default notif;
