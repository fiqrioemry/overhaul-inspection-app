import type { GetNotificationRequest } from "@/schemas/notification.schema";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { deleteNotification, fetchNotifications, getNotificationSettings, getUnreadNotificationCount, markAsRead, updateNotificationSettings } from "./notifications.api";
import { toast } from "sonner";

export const NOTIFICATION_KEYS = {
  unread: ["notifications", "unread"] as const,
  all: (params?: Omit<GetNotificationRequest, "page">) => ["notifications", params] as const,
  settings: ["notifications", "settings"] as const,
};

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unread,
    queryFn: () => getUnreadNotificationCount(),
    select: (data) => data.data.unreadCount,
    staleTime: 1000 * 30,
  });
}

export function useInfiniteNotifications(params: Omit<GetNotificationRequest, "page"> = { limit: 10 }) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_KEYS.all(params),
    queryFn: ({ pageParam = 1 }) => fetchNotifications({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil((lastPage.meta?.pagination?.totalItems ?? 0) / (params.limit ?? 10));
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
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
    onSuccess: (res) => {
      toast.success(res.message || "Notification settings updated");
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
    onSuccess: (res) => {
      toast.success(res.message || "Notifications deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
