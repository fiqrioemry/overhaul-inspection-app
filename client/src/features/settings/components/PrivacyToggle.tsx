// src/features/settings/components/PrivacyToggle.tsx
import { useState } from "react";
import { Lock, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdatePrivacy } from "@/features/settings/settings.query";
import { useAuthStore } from "@/stores/auth.store";

export default function PrivacyToggle() {
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
        <CardTitle>Account Privacy</CardTitle>
        <CardDescription>Control who can see your profile and posts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {isPublic ? <Globe className="h-5 w-5 text-muted-foreground mt-0.5" /> : <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />}
            <div className="flex-1">
              <p className="font-medium">{isPublic ? "Public Account" : "Private Account"}</p>
              <p className="text-sm text-muted-foreground mt-1">{isPublic ? "Anyone can see your profile and posts" : "Only approved followers can see your posts"}</p>
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={handleToggle} disabled={updatePrivacy.isPending} />
        </div>
      </CardContent>
    </Card>
  );
}
