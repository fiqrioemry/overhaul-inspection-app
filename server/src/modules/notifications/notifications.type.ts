export interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  metadata: Record<string, any>;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  FOLLOW = "FOLLOW",
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  MENTION = "MENTION",
  REACTION = "REACTION",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
}

export enum NotificationStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

export interface NotificationSetting {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
}

export interface NotificationMetadata {
  postId?: string;
  userId?: string;
  path?: string;
  likerId?: string;
  commentId?: string;
}
