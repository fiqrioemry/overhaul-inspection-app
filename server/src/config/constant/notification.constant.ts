const notificationAction = {
  DELETE_NOTIFICATION: "delete_notification",
  UPDATE_NOTIFICATION_SETTINGS: "update_notification_settings",
  MARK_AS_READ: "mark_as_read",
  MARK_ALL_AS_READ: "mark_all_as_read",
};

const notificationSuccessMessage = {
  GET_NOTIFICATIONS: "Notifications retrieved successfully",
  GET_NOTIFICATION_SETTINGS: "Notification settings retrieved successfully",
  UPDATE_NOTIFICATION_SETTINGS: "Notification settings updated successfully",
  MARK_AS_READ: "Notification marked as read",
  DELETE_NOTIFICATION: "Notification deleted successfully",
  GET_UNREAD_COUNT: "Unread count retrieved successfully",
};

const notificationErrorMessage = {
  NOTIFICATION_NOT_FOUND: "Notification not found",
  NOTIFICATION_SETTINGS_NOT_FOUND: "Notification settings not found",
};

const notificationErrorCode = {
  NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND",
  NOTIFICATION_SETTINGS_NOT_FOUND: "NOTIFICATION_SETTINGS_NOT_FOUND",
};

export { notificationAction, notificationSuccessMessage, notificationErrorMessage, notificationErrorCode };
