// src/features/chats/components/ChatHeader.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatInitials } from "@/utils/formatChat";
import type { ChatDetail } from "@/schemas/chats.schema";
import { useLeaveGroup } from "@/features/chats/chats.query";
import { ArrowLeft, Users, MoreVertical, Info } from "lucide-react";
import GroupInfoDialog from "@/features/chats/components/GroupInfoDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  chat: ChatDetail;
}

export default function ChatHeader({ chat }: ChatHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { setActiveChatId, setSidebarCollapsed } = useChatStore();
  const [showInfo, setShowInfo] = useState(false);
  const { mutate: leaveGroup } = useLeaveGroup(chat.id);

  const isGroup = chat.type === "GROUP";
  const other = !isGroup ? chat.participants.find((p) => p.userId !== user?.id) : null;

  const displayName = isGroup ? (chat.name ?? "Group") : (other?.user.name ?? "Unknown");
  const avatarUrl = isGroup ? chat.avatar : (other?.user.avatar ?? null);
  const subtitle = isGroup ? `${chat._count.participants} members` : `@${other?.user.username ?? ""}`;

  function handleBack() {
    setActiveChatId(null);
    setSidebarCollapsed(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        {/* Back button (mobile) */}
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0 text-muted-foreground" onClick={handleBack}>
          <ArrowLeft size={18} />
        </Button>

        {/* Avatar */}
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className={cn("text-sm font-semibold", isGroup ? "bg-primary/15 text-primary" : "bg-muted")}>{isGroup ? <Users size={16} /> : formatInitials(displayName)}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isGroup && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowInfo(true)}>
              <Info size={17} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical size={17} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isGroup && (
                <>
                  <DropdownMenuItem onClick={() => setShowInfo(true)}>
                    <Info className="size-4 mr-2" />
                    Group Info
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => leaveGroup()}>
                    {chat.participants.length === 1 ? "Delete group" : "Leave group"}
                  </DropdownMenuItem>
                </>
              )}
              {!isGroup && <DropdownMenuItem onClick={() => other && window.open(`/profile/${other.user.username}`, "_blank")}>View Profile</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Group Info Dialog */}
      {isGroup && showInfo && <GroupInfoDialog chat={chat} open={showInfo} onOpenChange={setShowInfo} />}
    </>
  );
}
