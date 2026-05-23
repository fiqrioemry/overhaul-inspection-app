import { cn } from "@/lib/utils";
import { useState } from "react";
import FollowListItem from "./FollowListItem";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetFollowers, useGetFollowings } from "@/features/users/users.query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "followers" | "following";
  userId: string;
}

export default function FollowListDialog({ open, onOpenChange, type, userId }: FollowListDialogProps) {
  const [search, setSearch] = useState("");

  const isFollowers = type === "followers";
  const { data: followersData, isLoading: isLoadingFollowers } = useGetFollowers({ targetUserId: userId, search }, type);
  const { data: followingData, isLoading: isLoadingFollowing } = useGetFollowings({ targetUserId: userId, search }, type);

  const users = isFollowers ? followersData?.data : followingData?.data;
  const isLoading = isFollowers ? isLoadingFollowers : isLoadingFollowing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("xl:w-auto xl:h-auto xl:max-w-lg xl:translate-x-0 xl:translate-y-0", "xl:inset-0 xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2", "flex flex-col transition-all duration-300")}
        showCloseButton={true}
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <DialogTitle className="text-center text-sm font-semibold">{isFollowers ? "Followers" : "Following"}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 bg-muted border-none" />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="h-80">
          <div className="px-4 py-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !users?.length ? (
              <p className="text-center text-sm text-muted-foreground py-8">{search ? "No users match your search." : "No users found."}</p>
            ) : (
              users.map((user) => <FollowListItem key={user.id} user={user} followStatus={user.followStatus} closeDialog={() => onOpenChange(false)} />)
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
