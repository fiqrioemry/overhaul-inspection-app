// src/features/settings/settings.queries.ts
import { toast } from "sonner";
import i18n from "@/i18n";
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
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_PRIVACY_SUCCESS"));
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
      toast.success(i18n.t("api:UPDATE_NOTIFICATION_SETTINGS"));
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.notifications });
    },
  });
}
