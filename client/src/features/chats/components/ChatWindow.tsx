// src/features/chats/components/ChatWindow.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/schemas/chats.schema";
import ChatInput from "@/features/chats/components/ChatInput";
import ChatHeader from "@/features/chats/components/ChatHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowDown, Check, CheckCheck, FileText, Music, Loader2 } from "lucide-react";
import { formatMessageTime, formatMessageDate, formatInitials } from "@/utils/formatChat";
import { useChatById, useInfiniteMessages, useReadMessages } from "@/features/chats/chats.query";
import { useTranslation } from "react-i18next";

interface ChatWindowProps {
  chatId: string;
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const user = useAuthStore((s) => s.user);
  const { optimisticMessages, clearUnread } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const { data: chatData } = useChatById(chatId);
  const chat = chatData?.data;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteMessages(chatId, {
    limit: 30,
  });

  const { mutate: readMessages } = useReadMessages(chatId);

  // Merge server messages with optimistic messages
  const serverMessages = data?.pages.flatMap((p) => p.data ?? []) ?? [];
  const optimistic = optimisticMessages[chatId] ?? [];

  // Optimistic messages that aren't in server yet
  const serverIds = new Set(serverMessages.map((m) => m.id));
  const pendingOptimistic = optimistic.filter((m) => !serverIds.has(m.id));

  // Combine: optimistic first (newest), then server
  const allMessages = [...pendingOptimistic, ...serverMessages];

  // Sort ascending for display
  const sortedMessages = [...allMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Read messages
  useEffect(() => {
    if (!chatId || !user) return;
    const unreadIds = sortedMessages.filter((m) => m.senderId !== user.id && !m.readBy.includes(user.id)).map((m) => m.id);
    if (unreadIds.length > 0) {
      readMessages({ messageIds: unreadIds });
      clearUnread(chatId);
    }
  }, [chatId, sortedMessages.length]);

  // Scroll to bottom on new messages if near bottom
  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [chatId]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distFromBottom < 100);
    setShowScrollBtn(distFromBottom > 300);

    // Load more when near top
    if (el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const prevScrollHeight = el.scrollHeight;
      fetchNextPage().then(() => {
        // Maintain scroll position after loading
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight;
          }
        });
      });
    }
  }

  if (!chat) return null;

  const isGroup = chat.type === "GROUP";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader chat={chat} />

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--muted)) 1px, transparent 0)", backgroundSize: "24px 24px", backgroundAttachment: "local" }}
      >
        {/* Load more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {isLoading ? <MessagesSkeleton /> : <MessageList messages={sortedMessages} currentUserId={user?.id ?? ""} isGroup={isGroup} />}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-20 right-6 size-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-10"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input */}
      <ChatInput chatId={chatId} />
    </div>
  );
}

function MessageList({ messages, currentUserId, isGroup }: { messages: ChatMessage[]; currentUserId: string; isGroup: boolean }) {
  const { t } = useTranslation(["chat"]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">{t("chat:noMessagesYet")}</p>
      </div>
    );
  }

  const elements: React.ReactNode[] = [];
  let lastDateStr = "";

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateStr = new Date(msg.createdAt).toDateString();
    const isMine = msg.senderId === currentUserId;
    const prevMsg = messages[i - 1];
    const nextMsg = messages[i + 1];

    // Group messages from same sender
    const isSameAsPrev = prevMsg?.senderId === msg.senderId && new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;
    const isSameAsNext = nextMsg?.senderId === msg.senderId && new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000;

    // Date separator
    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      elements.push(<DateSeparator key={`date-${msg.id}`} dateStr={msg.createdAt} />);
    }

    elements.push(<MessageBubble key={msg.id} message={msg} isMine={isMine} isGroup={isGroup} showAvatar={!isMine && !isSameAsNext} showSenderName={isGroup && !isMine && !isSameAsPrev} />);
  }

  return <>{elements}</>;
}

function DateSeparator({ dateStr }: { dateStr: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50 shadow-sm">{formatMessageDate(dateStr)}</span>
    </div>
  );
}

function MessageBubble({ message, isMine, isGroup, showAvatar, showSenderName }: { message: ChatMessage; isMine: boolean; isGroup: boolean; showAvatar: boolean; showSenderName: boolean }) {
  const isRead = message.readBy.length > 1 || (message.readBy.length > 0 && !message.readBy.includes(message.senderId));

  return (
    <div className={cn("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row", "mb-0.5")}>
      {/* Avatar placeholder for alignment */}
      {!isMine && isGroup && (
        <div className="w-7 shrink-0">
          {showAvatar && (
            <Avatar className="size-7">
              <AvatarImage src={message.sender.avatar ?? undefined} />
              <AvatarFallback className="text-[10px] font-semibold bg-muted">{formatInitials(message.sender.name)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[70%] gap-0.5", isMine && "items-end")}>
        {/* Sender name for group */}
        {showSenderName && <span className="text-[11px] font-medium text-primary ml-1">{message.sender.name}</span>}

        {/* Bubble */}
        <div className={cn("rounded-2xl px-3 py-2 text-sm shadow-sm", isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm")}>
          <MessageContent message={message} isMine={isMine} />
        </div>

        {/* Time + read status */}
        <div className={cn("flex items-center gap-1", isMine ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] text-muted-foreground">{formatMessageTime(message.createdAt)}</span>
          {isMine && (isRead ? <CheckCheck size={12} className="text-primary" /> : <Check size={12} className="text-muted-foreground" />)}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  if (message.type === "image" && message.mediaUrl) {
    return (
      <div className="flex flex-col gap-1">
        <img src={message.mediaUrl} alt="foto" className="max-w-60 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(message.mediaUrl!, "_blank")} />
        {message.text && message.text !== "image" && <p className="text-sm mt-1">{message.text}</p>}
      </div>
    );
  }

  if (message.type === "audio" && message.mediaUrl) {
    return (
      <div className="flex flex-col gap-1">
        <div className={cn("flex items-center gap-2 py-1", isMine ? "text-primary-foreground" : "text-foreground")}>
          <Music size={16} />
          <audio controls src={message.mediaUrl} className="max-w-50 h-8" />
        </div>
      </div>
    );
  }

  if (message.type === "file" && message.mediaUrl) {
    return (
      <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2 hover:underline", isMine ? "text-primary-foreground" : "text-primary")}>
        <FileText size={16} />
        <span className="text-sm truncate max-w-50">{message.text || "File"}</span>
      </a>
    );
  }

  return <p className="text-sm whitespace-pre-wrap wrap-break-words">{message.text}</p>;
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={cn("flex items-end gap-2", i % 3 === 0 ? "flex-row-reverse" : "flex-row")}>
          <Skeleton className="size-7 rounded-full shrink-0" />
          <Skeleton className={cn("h-10 rounded-2xl", i % 3 === 0 ? "w-40" : "w-56")} />
        </div>
      ))}
    </div>
  );
}
