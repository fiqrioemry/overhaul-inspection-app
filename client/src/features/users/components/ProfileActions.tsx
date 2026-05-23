import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, User, ChevronDown } from "lucide-react";
import { useFollowUser, useUnfollowUser } from "@/features/users/users.query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProfileActionsProps {
  userId: string;
  refetchProfile: () => void;
  isOwner: boolean;
  followStatus: "ACCEPTED" | "PENDING" | "NONE";
}

export default function ProfileActions({ userId, isOwner, followStatus, refetchProfile }: ProfileActionsProps) {
  const navigate = useNavigate();
  const { mutateAsync: follow, isPending: isFollowPending } = useFollowUser(userId);
  const { mutateAsync: unfollow, isPending: isUnfollowPending } = useUnfollowUser(userId);
  const isPending = isFollowPending || isUnfollowPending;

  const handleFollowToggle = async () => {
    const action = followStatus === "ACCEPTED" ? unfollow : followStatus === "PENDING" ? unfollow : follow;

    await action();
    refetchProfile();
  };

  if (isOwner) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
          Edit Profile
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="size-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/accounts")}>
              <User className="size-4 mr-2" />
              Accounts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button size="sm" variant={followStatus === "ACCEPTED" ? "outline" : followStatus === "PENDING" ? "secondary" : "default"} disabled={isPending} onClick={handleFollowToggle}>
      {followStatus === "ACCEPTED" ? "Unfollow" : followStatus === "PENDING" ? "Requested" : "Follow"}
    </Button>
  );
}
