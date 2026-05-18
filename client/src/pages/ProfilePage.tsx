import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useUserProfile } from "@/features/users/users.query";
import ProfileHeader from "@/features/users/components/ProfileHeader";
import ProfilePostsTab from "@/features/users/components/ProfilePostsTab";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, isError, refetch } = useUserProfile(username ?? "");
  const profile = data?.data;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-sm font-semibold">User not found</p>
        <p className="text-xs text-muted-foreground">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <ProfileHeader profile={profile} refetchProfile={refetch} />
      <Separator />
      <ProfilePostsTab userId={profile.id} isOwner={profile.isOwner} />
    </div>
  );
}
