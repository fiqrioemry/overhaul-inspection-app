export interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  metadata: NotificationMetadata;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = "COMMENT" | "LIKE" | "FOLLOW" | "MENTION" | "MESSAGE" | "REQUEST" | "REPOST";

export type NotificationChannel = "IN_APP";

export type NotificationStatus = "ENABLED" | "DISABLED";

export interface NotificationSetting {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
}

export interface NotificationMetadata {
  postId?: string;
  userId?: string;
  followerId?: string;
  path?: string;
  likerId?: string;
  commentId?: string;
}
