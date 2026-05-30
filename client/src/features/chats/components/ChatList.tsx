// src/features/chats/components/ChatList.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat.store";
import { useAuthStore } from "@/stores/auth.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyChats } from "@/features/chats/chats.query";
import type { ChatListItem } from "@/schemas/chats.schema";
import { Search, Plus, Users, MessageCircle } from "lucide-react";
import NewChatDialog from "@/features/chats/components/NewChatDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatChatTime, formatLastMessage, formatInitials } from "@/utils/formatChat";
import { useTranslation } from "react-i18next";

interface ChatListProps {
  onSelectChat?: (chatId: string) => void;
}

export default function ChatList({ onSelectChat }: ChatListProps) {
  const { t } = useTranslation(["chat"]);
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const { activeChatId, setActiveChatId, unreadCounts, chatListOverrides } = useChatStore();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useMyChats({ search: search || undefined });

  const chats = data?.data ?? [];

  function handleSelectChat(chatId: string) {
    setActiveChatId(chatId);
    onSelectChat?.(chatId);
  }

  function getChatDisplayName(chat: ChatListItem): string {
    if (chat.type === "GROUP") return chat.name ?? "Grup";
    const other = chat.participants.find((p) => p.userId !== user?.id);
    return other?.user.name ?? "Unknown";
  }

  function getChatAvatar(chat: ChatListItem): string | null {
    if (chat.type === "GROUP") return chat.avatar;
    const other = chat.participants.find((p) => p.userId !== user?.id);
    return other?.user.avatar ?? null;
  }

  function getChatDisplayInitials(chat: ChatListItem): string {
    return formatInitials(getChatDisplayName(chat));
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t("chat:chatTitle")}</h1>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl" onClick={() => setShowNewChat(true)}>
            <Plus size={18} />
          </Button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("chat:searchPlaceholder")}
            className="pl-8 h-9 text-sm bg-muted/60 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 rounded-xl"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ChatListSkeleton />
        ) : chats.length === 0 ? (
          <ChatListEmpty onNew={() => setShowNewChat(true)} />
        ) : (
          <ul className="py-1">
            {chats.map((chat) => {
              const override = chatListOverrides[chat.id] ?? {};
              const mergedChat = { ...chat, ...override };
              const isActive = activeChatId === chat.id;
              const unread = unreadCounts[chat.id] ?? mergedChat.unreadCount ?? 0;
              const displayName = getChatDisplayName(chat);
              const avatarUrl = getChatAvatar(chat);
              const lastMsg = mergedChat.lastMessage;
              const isGroup = chat.type === "GROUP";

              return (
                <li key={chat.id}>
                  <button
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn("w-full flex items-center gap-3 px-4 py-3 transition-colors text-left", isActive ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/50 border-l-2 border-transparent")}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar className="size-12">
                        <AvatarImage src={avatarUrl ?? undefined} />
                        <AvatarFallback className={cn("text-sm font-semibold", isGroup ? "bg-primary/15 text-primary" : "bg-muted")}>{isGroup ? <Users size={18} /> : getChatDisplayInitials(chat)}</AvatarFallback>
                      </Avatar>
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{unread > 99 ? "99+" : unread}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm truncate", unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>{displayName}</span>
                        {lastMsg && <span className="text-[11px] text-muted-foreground shrink-0">{formatChatTime(lastMsg.createdAt)}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={cn("text-xs truncate flex-1", unread > 0 ? "text-foreground/80" : "text-muted-foreground")}>
                          {lastMsg ? formatLastMessage(lastMsg.text, lastMsg.type, isGroup && lastMsg.senderId !== user?.id ? lastMsg.sender.name : undefined) : t("chat:noMessagesYet")}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showNewChat && <NewChatDialog open={showNewChat} onOpenChange={setShowNewChat} />}
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="py-2 px-4 flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatListEmpty({ onNew }: { onNew: () => void }) {
  const { t } = useTranslation(["chat"]);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-16 px-6 text-center">
      <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
        <MessageCircle size={28} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t("chat:noConversationsYet")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("chat:startNewChat")}</p>
      </div>
      <Button size="sm" onClick={onNew} className="rounded-xl">
        <Plus size={14} className="mr-1.5" />
        {t("chat:newMessage")}
      </Button>
    </div>
  );
}
