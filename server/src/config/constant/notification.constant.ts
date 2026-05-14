const notificationAction = {
  DELETE_NOTIFICATION: "delete_notification",
  UPDATE_NOTIFICATION_SETTINGS: "update_notification_settings",
};

const notificationSuccessMessage = {
  GET_NOTIFICATIONS: "get notifications successfully",
  GET_NOTIFICATION_SETTINGS: "get notification settings successfully",
  UPDATE_NOTIFICATION_SETTINGS: "update notification settings successfully",
  MARK_AS_READ: "mark notification as read successfully",
  DELETE_NOTIFICATION: "notification deleted successfully",
};

const notificationErrorMessage = {
  NOTIFICATION_SETTINGS_NOT_FOUND: "Notification settings not found",
};

const notificationErrorCode = {
  NOTIFICATION_SETTINGS_NOT_FOUND: "NOTIFICATION_SETTINGS_NOT_FOUND",
};

export { notificationAction, notificationSuccessMessage, notificationErrorMessage, notificationErrorCode };
