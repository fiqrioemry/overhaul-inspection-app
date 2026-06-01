import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { NotificationController as ctrl } from "@/modules/notifications/notification.controller";

const notif = new Hono();

notif.get("/unread-count", protect, ctrl.getUnreadNotificationCount);
notif.get("/", protect, ctrl.getUserNotifications);

export default notif;
