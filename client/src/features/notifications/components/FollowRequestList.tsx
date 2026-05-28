import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { User } from "@/types/users.type";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, UserCheck, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetFollowRequests, useAcceptFollowRequest, useRejectFollowRequest } from "@/features/users/users.query";

function FollowRequestSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5 rounded" />
        <Skeleton className="h-3 w-1/4 rounded" />
      </div>
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-7 w-16 rounded-md" />
    </div>
  );
}

function EmptyRequests() {
  const { t } = useTranslation(["notif"]);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <UserCheck size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{t("notif:noPendingRequests")}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-48">{t("notif:followRequestInfo")}</p>
    </div>
  );
}

interface FollowRequestItemProps {
  user: User;
  isResponding: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function FollowRequestItem({ user, isResponding, onAccept, onReject }: FollowRequestItemProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(["notif"]);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors">
      <button onClick={() => navigate(`/profile/${user.username}`)} className="shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar ?? "/default-avatar.png"} alt={user.username} />
          <AvatarFallback className="text-sm font-semibold">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={() => navigate(`/profile/${user.username}`)} className="text-left">
          <p className="text-sm font-semibold truncate hover:underline">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="default" disabled={isResponding} onClick={onAccept} className="h-8 px-3 text-xs gap-1.5">
          {isResponding ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          {t("notif:accept")}
        </Button>
        <Button size="sm" variant="outline" disabled={isResponding} onClick={onReject} className={cn("h-8 px-3 text-xs gap-1.5 text-muted-foreground")}>
          <X size={11} />
          {t("notif:reject")}
        </Button>
      </div>
    </div>
  );
}

interface FollowRequestListProps {
  search?: string;
}

export default function FollowRequestList({ search }: FollowRequestListProps) {
  const { data, isLoading } = useGetFollowRequests();
  const { t } = useTranslation(["notif"]);
  const { mutate: accept, isPending: isAccepting, variables: acceptingId } = useAcceptFollowRequest();
  const { mutate: reject, isPending: isRejecting, variables: rejectingId } = useRejectFollowRequest();

  const requests = data?.data ?? [];

  const filtered = search?.trim() ? requests.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())) : requests;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <FollowRequestSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) return <EmptyRequests />;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        {filtered.length} {t("notif:pendingRequests", { count: filtered.length })}
      </p>
      {filtered.map((user) => {
        const isResponding = (isAccepting && acceptingId === user.id) || (isRejecting && rejectingId === user.id);

        return <FollowRequestItem key={user.id} user={user} isResponding={isResponding} onAccept={() => accept(user.follower.id!)} onReject={() => reject(user.follower.id)} />;
      })}
    </div>
  );
}
