export const NOTIFICATIONS_ENDPOINTS = {
  markAsRead: "/notifications/read",
  getUserNotifications: "/notifications",
  deleteNotification: "/notifications/delete",
  getUnreadCount: "/notifications/unread-count",
  getNotificationSettings: "/notifications/settings",
  updateNotificationSettings: "/notifications/settings",
} as const;
