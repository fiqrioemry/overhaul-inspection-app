// src/features/chats/components/ChatWindow.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage, ReactionGroup, ReplyToMessage } from "@/schemas/chats.schema";
import ChatInput from "@/features/chats/components/ChatInput";
import ChatHeader from "@/features/chats/components/ChatHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowDown, Check, CheckCheck, FileText, Music, Loader2, CornerUpLeft, SmilePlus } from "lucide-react";
import { formatMessageTime, formatMessageDate, formatInitials } from "@/utils/formatChat";
import { useChatById, useInfiniteMessages, useReadMessages, useAddReaction } from "@/features/chats/chats.query";
import { useTranslation } from "react-i18next";

const ALLOWED_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "🎉", "👀"];

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
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  // Track chatId changes in render phase to reset replyTo without an effect
  const [activeChatId, setActiveChatId] = useState(chatId);
  if (activeChatId !== chatId) {
    setActiveChatId(chatId);
    setReplyTo(null);
  }

  const { data: chatData } = useChatById(chatId);
  const chat = chatData?.data;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteMessages(chatId, {
    limit: 30,
  });

  const { mutate: readMessages } = useReadMessages(chatId);

  const serverMessages = data?.pages.flatMap((p) => p.data ?? []) ?? [];
  const optimistic = optimisticMessages[chatId] ?? [];

  const serverIds = new Set(serverMessages.map((m) => m.id));
  const pendingOptimistic = optimistic.filter((m) => !serverIds.has(m.id));
  // Apply any optimistic reaction updates (from WS or own mutations) to server messages
  const optimisticById = new Map(optimistic.map((m) => [m.id, m]));
  const mergedServer = serverMessages.map((m) => {
    const opt = optimisticById.get(m.id);
    return opt?.reactions !== undefined ? { ...m, reactions: opt.reactions } : m;
  });

  const allMessages = [...pendingOptimistic, ...mergedServer];
  const sortedMessages = [...allMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    if (!chatId || !user) return;
    const unreadIds = sortedMessages.filter((m) => m.senderId !== user.id && !m.readBy.includes(user.id)).map((m) => m.id);
    if (unreadIds.length > 0) {
      readMessages({ messageIds: unreadIds });
      clearUnread(chatId);
    }
  }, [chatId, sortedMessages.length]);

  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [chatId]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distFromBottom < 100);
    setShowScrollBtn(distFromBottom > 300);

    if (el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const prevScrollHeight = el.scrollHeight;
      fetchNextPage().then(() => {
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
      <ChatHeader chat={chat} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--muted)) 1px, transparent 0)", backgroundSize: "24px 24px", backgroundAttachment: "local" }}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {isLoading ? (
          <MessagesSkeleton />
        ) : (
          <MessageList
            messages={sortedMessages}
            currentUserId={user?.id ?? ""}
            isGroup={isGroup}
            chatId={chatId}
            onReply={(msg) =>
              setReplyTo({
                id: msg.id,
                text: msg.text,
                type: msg.type,
                sender: { id: msg.sender.id, name: msg.sender.name, username: msg.sender.username },
              })
            }
          />
        )}

        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-20 right-6 size-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-10"
        >
          <ArrowDown size={16} />
        </button>
      )}

      <ChatInput chatId={chatId} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </div>
  );
}

function MessageList({ messages, currentUserId, isGroup, chatId, onReply }: { messages: ChatMessage[]; currentUserId: string; isGroup: boolean; chatId: string; onReply: (msg: ChatMessage) => void }) {
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

    const isSameAsPrev = prevMsg?.senderId === msg.senderId && new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;
    const isSameAsNext = nextMsg?.senderId === msg.senderId && new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() < 5 * 60 * 1000;

    if (dateStr !== lastDateStr) {
      lastDateStr = dateStr;
      elements.push(<DateSeparator key={`date-${msg.id}`} dateStr={msg.createdAt} />);
    }

    elements.push(
      <MessageBubble key={msg.id} message={msg} isMine={isMine} isGroup={isGroup} showAvatar={!isMine && !isSameAsNext} showSenderName={isGroup && !isMine && !isSameAsPrev} chatId={chatId} currentUserId={currentUserId} onReply={onReply} />,
    );
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

function MessageBubble({
  message,
  isMine,
  isGroup,
  showAvatar,
  showSenderName,
  chatId,
  currentUserId,
  onReply,
}: {
  message: ChatMessage;
  isMine: boolean;
  isGroup: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  chatId: string;
  currentUserId: string;
  onReply: (msg: ChatMessage) => void;
}) {
  const { t } = useTranslation(["chat"]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const addReaction = useAddReaction(chatId, message.id);
  const isRead = message.readBy.length > 1 || (message.readBy.length > 0 && !message.readBy.includes(message.senderId));
  const reactions: ReactionGroup[] = message.reactions ?? [];

  function handleReact(emoji: string) {
    addReaction.mutate({ emoji });
    setEmojiOpen(false);
  }

  return (
    <div className={cn("flex items-end gap-2 group", isMine ? "flex-row-reverse" : "flex-row", "mb-0.5")}>
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
        {showSenderName && <span className="text-[11px] font-medium text-primary ml-1">{message.sender.name}</span>}

        {/* Reply context */}
        {message.replyTo && (
          <div className={cn("text-[11px] px-2 py-1 rounded-lg border-l-2 border-primary/50 bg-muted/40 max-w-full", isMine ? "self-end" : "self-start")}>
            <p className="font-medium text-primary/80">{message.replyTo.sender.name}</p>
            <p className="text-muted-foreground truncate max-w-40">{message.replyTo.text}</p>
          </div>
        )}

        {/* Bubble */}
        <div className={cn("rounded-2xl px-3 py-2 text-sm shadow-sm relative", isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm")}>
          <MessageContent message={message} isMine={isMine} />

          {/* Action buttons shown on hover */}
          <div className={cn("absolute -top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", isMine ? "-left-16" : "-right-16")}>
            {/* Reply button */}
            <button onClick={() => onReply(message)} className="p-1 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground">
              <CornerUpLeft size={12} />
            </button>

            {/* Emoji reaction picker */}
            <div className="relative">
              <button onClick={() => setEmojiOpen((v) => !v)} className="p-1 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground" aria-label={t("chat:addReaction")}>
                <SmilePlus size={12} />
              </button>
              {emojiOpen && (
                <div className={cn("absolute bottom-full mb-1 z-20 flex gap-1 bg-background border border-border rounded-xl shadow-lg p-1.5", isMine ? "right-0" : "left-0")}>
                  {ALLOWED_EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => handleReact(emoji)} className="text-lg hover:scale-125 transition-transform p-0.5 rounded" aria-label={emoji}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reaction pills */}
        {reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
            {reactions.map((r) => {
              const iReacted = r.userIds.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => handleReact(r.emoji)}
                  className={cn(
                    "flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors",
                    iReacted ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-foreground hover:bg-muted",
                  )}
                  title={`${r.count} ${t("chat:reactions")}`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

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
