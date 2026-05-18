export const NOTIFICATIONS_ENDPOINTS = {
  getUnreadCount: "/notifications/unread-count",
  getUserNotifications: "/notifications",
  getNotificationSettings: "/notifications/settings",
  updateNotificationSettings: "/notifications/settings",
  markAsRead: "/notifications/read",
  deleteNotification: "/notifications/delete",
} as const;
