// src/features/settings/components/PrivacyToggle.tsx
import { useState } from "react";
import { Lock, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdatePrivacy } from "@/features/settings/settings.query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyToggle() {
  const { t } = useTranslation(["setting"]);
  const { user } = useAuthStore();
  const updatePrivacy = useUpdatePrivacy();
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);

  const handleToggle = async (checked: boolean) => {
    const newValue = checked;
    setIsPublic(newValue);

    try {
      await updatePrivacy.mutateAsync({ isPublic: newValue });
    } catch (error) {
      console.log("Failed to update privacy setting:", error);
      // Revert on error
      setIsPublic(!newValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("setting:privacyTitle")}</CardTitle>
        <CardDescription>{t("setting:privacyDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {isPublic ? <Globe className="h-5 w-5 text-muted-foreground mt-0.5" /> : <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />}
            <div className="flex-1">
              <p className="font-medium">{isPublic ? t("setting:publicAccount") : t("setting:privateAccount")}</p>
              <p className="text-sm text-muted-foreground mt-1">{isPublic ? t("setting:publicAccountDescription") : t("setting:privateAccountDescription")}</p>
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={handleToggle} disabled={updatePrivacy.isPending} />
        </div>
      </CardContent>
    </Card>
  );
}
