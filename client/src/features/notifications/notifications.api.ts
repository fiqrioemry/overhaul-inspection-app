// src/features/notifications/notifications.api.ts
import api from "@/lib/axios";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export type NotificationType =
  | "INSPECTION_REVIEW_REQUESTED"
  | "INSPECTION_REVIEWED"
  | "FINDING_CREATED"
  | "FINDING_STATUS_UPDATED"
  | "TEST_RESULT_UPDATED"
  | "RADIOGRAPHY_RESULT_UPDATED"
  | (string & Record<never, never>);

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export async function getNotifications(params?: NotificationListParams): Promise<PaginatedResponse<Notification>> {
  const res = await api.get<ResponseSuccess<PaginatedResponse<Notification>>>("/notifications", { params });
  return res.data.data!;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<ResponseSuccess<{ count: number }>>("/notifications/unread-count");
  return res.data.data?.count ?? 0;
}

export async function markAsRead(id: string): Promise<ResponseOK> {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllAsRead(): Promise<ResponseOK> {
  const res = await api.patch("/notifications/read-all");
  return res.data;
}
