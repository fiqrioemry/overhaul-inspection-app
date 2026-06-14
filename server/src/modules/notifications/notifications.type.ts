import { NotificationChannel, NotificationStatus, NotificationType } from "generated/prisma";

export interface Notification {
  id: string;
  title: string;
  description: string | null;
  type: NotificationType;
  metadata: Record<string, any> | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationSetting {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
}

export interface NotificationMetadata {
  targetType?: string;
  targetId?: string;
  tankId?: string;
  tankNo?: string;
  processName?: string;
  findingNo?: string;
}
