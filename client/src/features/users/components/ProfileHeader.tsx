import { useState } from "react";
import ProfileStats from "./ProfileStats";
import ProfileActions from "./ProfileActions";
import FollowListDialog from "./FollowListDialog";
import type { UserProfile } from "@/types/users.type";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  profile: UserProfile;
  refetchProfile: () => void;
}

type DialogType = "followers" | "following" | null;

export default function ProfileHeader({ profile, refetchProfile }: ProfileHeaderProps) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  return (
    <>
      <div className="space-y-4">
        {/* Top row: avatar + stats */}
        <div className="flex items-center gap-6 sm:gap-10">
          <Avatar className="size-20 sm:size-28 shrink-0 ring-2 ring-offset-2 ring-pink-500">
            <AvatarImage src={profile.avatar ?? "/default-avatar.png"} alt={profile.username} />
            <AvatarFallback className="text-xl font-bold">{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-3 min-w-0">
            {/* Name + actions */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold">{profile.username}</span>
              <ProfileActions userId={profile.id} isOwner={profile.isOwner} isFollowing={profile.isFollowing} refetchProfile={refetchProfile} />
            </div>

            {/* Stats — hidden on mobile, shown on sm+ */}
            <div className="hidden sm:block">
              <ProfileStats posts={profile.totalPosts} followers={profile.totalFollowers} following={profile.totalFollowings} onFollowersClick={() => setOpenDialog("followers")} onFollowingClick={() => setOpenDialog("following")} />
            </div>

            {/* Bio */}
            {profile.bio && <p className="text-sm text-muted-foreground leading-snug max-w-xs">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats row — mobile only */}
        <div className="sm:hidden">
          <Separator className="mb-3" />
          <ProfileStats posts={profile.totalPosts} followers={profile.totalFollowers} following={profile.totalFollowings} onFollowersClick={() => setOpenDialog("followers")} onFollowingClick={() => setOpenDialog("following")} />
        </div>
      </div>

      {/* Follow dialogs */}
      {openDialog && <FollowListDialog open onOpenChange={(v) => !v && setOpenDialog(null)} type={openDialog} userId={profile.id} />}
    </>
  );
}
