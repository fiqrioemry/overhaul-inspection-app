// src/features/settings/settings.types.ts
import type { NotificationSetting } from "@/types/notifications.type";

export interface UpdatePrivacyRequest {
  isPublic: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Session {
  id: string;
  userId: string;
  userAgent: string;
  expiresAt: Date;
  loginAt: Date;
}

export interface SessionWithCurrent extends Session {
  isCurrent: boolean;
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
  };
}

export interface NotificationSettingsResponse {
  settings: NotificationSetting[];
}

export interface UpdateNotificationSettingsRequest {
  type: string;
  status: "ENABLED" | "DISABLED";
}
