// src/features/users/components/ProfileActions.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, User, ChevronDown, ShieldOff, VolumeX, Volume2, ShieldCheck } from "lucide-react";
import { useFollowUser, useUnfollowUser, useBlockUser, useUnblockUser, useMuteUser, useUnmuteUser } from "@/features/users/users.query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProfileActionsProps {
  userId: string;
  refetchProfile: () => void;
  isOwner: boolean;
  followStatus: "ACCEPTED" | "PENDING" | "NONE";
  isBlocked?: boolean;
  isMuted?: boolean;
}

export default function ProfileActions({ userId, isOwner, followStatus, refetchProfile, isBlocked: initialIsBlocked = false, isMuted: initialIsMuted = false }: ProfileActionsProps) {
  const navigate = useNavigate();
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [isMuted, setIsMuted] = useState(initialIsMuted);

  const { mutateAsync: follow, isPending: isFollowPending } = useFollowUser(userId);
  const { mutateAsync: unfollow, isPending: isUnfollowPending } = useUnfollowUser(userId);
  const { mutateAsync: block, isPending: isBlockPending } = useBlockUser();
  const { mutateAsync: unblock, isPending: isUnblockPending } = useUnblockUser();
  const { mutateAsync: mute, isPending: isMutePending } = useMuteUser();
  const { mutateAsync: unmute, isPending: isUnmutePending } = useUnmuteUser();

  const isPending = isFollowPending || isUnfollowPending;

  async function handleFollowToggle() {
    const action = followStatus === "ACCEPTED" ? unfollow : followStatus === "PENDING" ? unfollow : follow;
    await action();
    refetchProfile();
  }

  async function handleBlockToggle() {
    if (isBlocked) {
      await unblock(userId);
      setIsBlocked(false);
    } else {
      await block(userId);
      setIsBlocked(true);
    }
    refetchProfile();
  }

  async function handleMuteToggle() {
    if (isMuted) {
      await unmute(userId);
      setIsMuted(false);
    } else {
      await mute({ targetUserId: userId, muteType: "all" });
      setIsMuted(true);
    }
  }

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
    <div className="flex items-center gap-2">
      {!isBlocked && (
        <Button
          size="sm"
          variant={followStatus === "ACCEPTED" ? "outline" : followStatus === "PENDING" ? "secondary" : "default"}
          disabled={isPending}
          onClick={handleFollowToggle}
        >
          {followStatus === "ACCEPTED" ? "Unfollow" : followStatus === "PENDING" ? "Requested" : "Follow"}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleMuteToggle}
            disabled={isMutePending || isUnmutePending}
          >
            {isMuted ? (
              <>
                <Volume2 className="size-4 mr-2" />
                Unmute
              </>
            ) : (
              <>
                <VolumeX className="size-4 mr-2" />
                Mute
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleBlockToggle}
            disabled={isBlockPending || isUnblockPending}
            className={isBlocked ? "text-foreground" : "text-destructive focus:text-destructive"}
          >
            {isBlocked ? (
              <>
                <ShieldCheck className="size-4 mr-2" />
                Unblock
              </>
            ) : (
              <>
                <ShieldOff className="size-4 mr-2" />
                Block
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
