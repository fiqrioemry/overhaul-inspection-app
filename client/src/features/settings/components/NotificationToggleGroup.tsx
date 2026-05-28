// src/features/settings/components/NotificationToggleGroup.tsx
import { Switch } from "@/components/ui/switch";
import type { NotificationSetting } from "@/types/notifications.type";
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationSettings, useUpdateNotificationSetting } from "@/features/settings/settings.query";

const NOTIFICATION_CONFIG = [
  {
    type: "LIKE",
    icon: Heart,
    label: "Likes",
    description: "Get notified when someone likes your post",
  },
  {
    type: "COMMENT",
    icon: MessageCircle,
    label: "Comments",
    description: "Get notified when someone comments on your post",
  },
  {
    type: "FOLLOW",
    icon: UserPlus,
    label: "New Followers",
    description: "Get notified when someone follows you",
  },
  {
    type: "MENTION",
    icon: AtSign,
    label: "Mentions",
    description: "Get notified when someone mentions you",
  },
];

export default function NotificationToggleGroup() {
  const { data, isLoading } = useNotificationSettings();
  const updateSetting = useUpdateNotificationSetting();

  const settings = data?.data || [];

  const getSettingId = (type: string): string | undefined => {
    const setting = settings.find((s: NotificationSetting) => s.type === type);
    console.log(`Getting setting ID for type: ${type}, found setting:`, setting);
    return setting?.id;
  };
  const getSettingStatus = (type: string): boolean => {
    const setting = settings.find((s: NotificationSetting) => s.type === type);
    return setting?.status === "ENABLED";
  };

  const handleToggle = async (notificationId: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? "DISABLED" : "ENABLED";
    await updateSetting.mutateAsync({ notificationId, status: newStatus });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Push Notifications</CardTitle>
        </div>
        <CardDescription>Choose what notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {NOTIFICATION_CONFIG.map((config) => {
          const Icon = config.icon;
          const isEnabled = getSettingStatus(config.type);
          const isUpdating = updateSetting.isPending;

          return (
            <div key={config.type} className="flex items-start justify-between gap-4 pb-6 last:pb-0 border-b last:border-0">
              <div className="flex items-start gap-3 flex-1">
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                </div>
              </div>
              <Switch checked={isEnabled} onCheckedChange={() => handleToggle(getSettingId(config.type)!, isEnabled)} disabled={isUpdating} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
