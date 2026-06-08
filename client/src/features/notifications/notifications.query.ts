import { toast } from "sonner";
import i18n from "@/i18n";
import type { GetNotificationRequest } from "@/schemas/notification.schema";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { deleteNotification, fetchNotifications, getNotificationSettings, getUnreadNotificationCount, markAsRead, updateNotificationSettings } from "./notifications.api";

export const NOTIFICATION_KEYS = {
  unread: ["notifications", "unread"] as const,
  all: (params?: Omit<GetNotificationRequest, "page">) => ["notifications", params] as const,
  settings: ["notifications", "settings"] as const,
  infinite: (params?: Omit<GetNotificationRequest, "page">) => ["notifications", "infinite", params] as const,
};

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unread,
    queryFn: () => getUnreadNotificationCount(),
    select: (data) => data.data.unreadCount,
    staleTime: 1000 * 30,
  });
}

export function useInfiniteNotifications(query: Omit<GetNotificationRequest, "page">, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.infinite(query),
    queryFn: ({ pageParam = 1 }) => fetchNotifications({ ...query, page: pageParam }),
    getNextPageParam: (last) => {
      const { page, totalPages } = last.meta.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: options?.enabled !== false,
    staleTime: 1000 * 30,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.settings,
    queryFn: () => getNotificationSettings(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: string; enabled: boolean }) => updateNotificationSettings(payload),
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_NOTIFICATION_SETTINGS"));
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.settings });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[]) => markAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[]) => deleteNotification(notificationIds),
    onSuccess: () => {
      toast.success(i18n.t("api:DELETE_NOTIFICATION"));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
