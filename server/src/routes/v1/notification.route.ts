import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { NotificationController as ctrl } from "@/controllers/notification.controller";

const notif = new Hono();

notif.get("/", protect, ctrl.getUserNotifications);
notif.get("/settings", protect, ctrl.getNotificationSettings);
notif.put("/settings", protect, ctrl.updateNotificationSettings);
notif.post("/:notificationId/read", protect, ctrl.markAsRead);
notif.delete("/delete", protect, ctrl.deleteNotification);
// total endpoints: 5
export default notif;
