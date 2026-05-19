import qs from "qs";
import api from "@/lib/axios";
import { NOTIFICATIONS_ENDPOINTS } from "@/constants/notifications.constant";
import type { GetNotificationRequest } from "@/schemas/notification.schema";
import type { UpdateNotificationSettingsRequest } from "@/types/sessions.type";

export async function getUnreadNotificationCount() {
  const res = await api.get(NOTIFICATIONS_ENDPOINTS.getUnreadCount);
  return res.data;
}

export async function fetchNotifications(query: GetNotificationRequest) {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${NOTIFICATIONS_ENDPOINTS.getUserNotifications}?${queryString}`);
  return res.data;
}

export async function getNotificationSettings() {
  const res = await api.get(NOTIFICATIONS_ENDPOINTS.getNotificationSettings);
  return res.data;
}

export async function updateNotificationSettings(payload: UpdateNotificationSettingsRequest) {
  console.log("Updating notification settings with payload:", payload);
  const res = await api.put(NOTIFICATIONS_ENDPOINTS.updateNotificationSettings, payload);
  return res.data;
}

export async function markAsRead(notificationIds: string[]) {
  const res = await api.post(NOTIFICATIONS_ENDPOINTS.markAsRead, { notificationIds });
  return res.data;
}

export async function deleteNotification(notificationIds: string[]) {
  const res = await api.delete(NOTIFICATIONS_ENDPOINTS.deleteNotification, {
    data: { notificationIds },
  });
  return res.data;
}
