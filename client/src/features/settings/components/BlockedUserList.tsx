// src/features/settings/components/BlockedUserList.tsx
import { Link } from "react-router-dom";
import { ShieldOff, UserX } from "lucide-react";
import { useGetBlockedUsers, useUnblockUser } from "@/features/users/users.query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInitials } from "@/utils/formatString";

export default function BlockedUserList() {
  const { data, isLoading } = useGetBlockedUsers();
  const { mutate: unblock, isPending } = useUnblockUser();

  const blockedUsers = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldOff className="size-4 text-muted-foreground" />
          <div>
            <CardTitle>Blocked Users</CardTitle>
            <CardDescription>Users you've blocked can't see your posts or send you messages.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-2.5 w-20 rounded" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && blockedUsers.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <UserX className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No blocked users</p>
          </div>
        )}

        {!isLoading && blockedUsers.length > 0 && (
          <div className="space-y-3">
            {blockedUsers.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={item.user.avatar ?? undefined} />
                  <AvatarFallback className="text-xs font-semibold">{formatInitials(item.user.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${item.user.username}`} className="text-sm font-medium hover:underline truncate block">
                    {item.user.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">@{item.user.username}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => unblock(item.blockedId)}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
