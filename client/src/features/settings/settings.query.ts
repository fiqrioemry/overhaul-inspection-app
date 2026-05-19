// src/features/settings/settings.queries.ts
import { toast } from "sonner";
import { AUTH_KEYS } from "@/features/auth/auth.query";
import { USER_KEYS } from "@/features/users/users.query";
import { updatePrivacy } from "@/features/users/users.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotificationSettings, updateNotificationSettings } from "@/features/notifications/notifications.api";

export const SETTINGS_KEYS = {
  notifications: ["settings", "notifications"] as const,
};

export function useUpdatePrivacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrivacy,
    onSuccess: (res) => {
      toast.success(res.message || "Privacy settings updated");
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: SETTINGS_KEYS.notifications,
    queryFn: getNotificationSettings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.notifications });
      toast.success("Notification settings updated");
    },
  });
}
