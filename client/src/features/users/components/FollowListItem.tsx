import { useNavigate } from "react-router-dom";
import type { User } from "@/types/users.type";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import UserAvatar from "@/features/users/components/UserAvatar";
import { useFollowUser, useUnfollowUser } from "@/features/users/users.query";

interface FollowListItemProps {
  user: User;
  isFollowing: boolean;
  closeDialog: () => void;
}

export default function FollowListItem({ user, isFollowing, closeDialog }: FollowListItemProps) {
  const { user: data } = useAuthStore();
  const navigate = useNavigate();
  const { mutate: follow, isPending: isFollowPending } = useFollowUser(user.id);
  const { mutate: unfollow, isPending: isUnfollowPending } = useUnfollowUser(user.id);
  const isPending = isFollowPending || isUnfollowPending;

  function handleFollowToggle() {
    const action = isFollowing ? unfollow : follow;
    action();
  }

  function handleNavigateToProfile() {
    closeDialog();
    navigate(`/profile/${user.username}`);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <button className="hover:underline hover:text-blue-500 text-sm text-muted-foreground truncate" onClick={handleNavigateToProfile}>
            @{user.username}
          </button>
        </div>
      </div>
      {data?.id !== user.id && (
        <Button size="sm" variant={isFollowing ? "outline" : "default"} disabled={isPending} onClick={handleFollowToggle} className="shrink-0">
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}
    </div>
  );
}
