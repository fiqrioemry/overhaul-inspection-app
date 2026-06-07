import { create } from "zustand";
import { CHAT_WS_EVENTS } from "@/constants/chats.constant";
import type { ChatListItem, ChatMessage, ReactionGroup, WsNewMessagePayload, WsMessageReadPayload, WsGroupUpdatedPayload, WsReactionPayload } from "@/schemas/chats.schema";

interface ChatStore {
  // Active chat
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  // Selected messages (for bulk delete)
  selectedMessageIds: Set<string>;
  toggleSelectMessage: (id: string) => void;
  clearSelectedMessages: () => void;
  isSelectMode: boolean;
  setSelectMode: (v: boolean) => void;

  // Optimistic messages (WS injected)
  optimisticMessages: Record<string, ChatMessage[]>; // chatId -> messages
  addOptimisticMessage: (chatId: string, message: ChatMessage) => void;
  markOptimisticRead: (chatId: string, messageIds: string[], readBy: string) => void;
  updateOptimisticReactions: (chatId: string, messageId: string, reactions: ReactionGroup[]) => void;
  clearOptimisticMessages: (chatId: string) => void;

  // Unread counts (WS updated)
  unreadCounts: Record<string, number>;
  incrementUnread: (chatId: string) => void;
  clearUnread: (chatId: string) => void;

  // Chat list override (WS updated last messages)
  chatListOverrides: Record<string, Partial<ChatListItem>>;
  updateChatListOverride: (chatId: string, data: Partial<ChatListItem>) => void;

  // Sidebar collapsed (for /messages route)
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),

  selectedMessageIds: new Set(),
  toggleSelectMessage: (id) => {
    const next = new Set(get().selectedMessageIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedMessageIds: next });
  },
  clearSelectedMessages: () => set({ selectedMessageIds: new Set() }),
  isSelectMode: false,
  setSelectMode: (v) => {
    if (!v) set({ selectedMessageIds: new Set() });
    set({ isSelectMode: v });
  },

  optimisticMessages: {},
  addOptimisticMessage: (chatId, message) => {
    const prev = get().optimisticMessages[chatId] ?? [];
    set({
      optimisticMessages: {
        ...get().optimisticMessages,
        [chatId]: [message, ...prev],
      },
    });
  },
  markOptimisticRead: (chatId, messageIds, readBy) => {
    const msgs = get().optimisticMessages[chatId] ?? [];
    const updated = msgs.map((m) => (messageIds.includes(m.id) && !m.readBy.includes(readBy) ? { ...m, readBy: [...m.readBy, readBy] } : m));
    set({
      optimisticMessages: { ...get().optimisticMessages, [chatId]: updated },
    });
  },
  updateOptimisticReactions: (chatId, messageId, reactions) => {
    const msgs = get().optimisticMessages[chatId] ?? [];
    const updated = msgs.map((m) => (m.id === messageId ? { ...m, reactions } : m));
    set({ optimisticMessages: { ...get().optimisticMessages, [chatId]: updated } });
  },
  clearOptimisticMessages: (chatId) => {
    const next = { ...get().optimisticMessages };
    delete next[chatId];
    set({ optimisticMessages: next });
  },

  unreadCounts: {},
  incrementUnread: (chatId) => {
    const prev = get().unreadCounts[chatId] ?? 0;
    set({ unreadCounts: { ...get().unreadCounts, [chatId]: prev + 1 } });
  },
  clearUnread: (chatId) => {
    set({ unreadCounts: { ...get().unreadCounts, [chatId]: 0 } });
  },

  chatListOverrides: {},
  updateChatListOverride: (chatId, data) => {
    set({
      chatListOverrides: {
        ...get().chatListOverrides,
        [chatId]: { ...(get().chatListOverrides[chatId] ?? {}), ...data },
      },
    });
  },

  isSidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ isSidebarCollapsed: v }),
}));

export function handleChatWsEvent(event: string, payload: WsNewMessagePayload | WsMessageReadPayload | WsGroupUpdatedPayload | WsReactionPayload, currentUserId: string) {
  const store = useChatStore.getState();

  if (event === CHAT_WS_EVENTS.NEW_MESSAGE) {
    const p = payload as WsNewMessagePayload;
    store.addOptimisticMessage(p.chatId, p.message);

    // If not in this chat, increment unread
    if (store.activeChatId !== p.chatId && p.message.senderId !== currentUserId) {
      store.incrementUnread(p.chatId);
    }

    // Update last message in list
    store.updateChatListOverride(p.chatId, {
      lastMessage: {
        id: p.message.id,
        text: p.message.text,
        type: p.message.type,
        senderId: p.message.senderId,
        createdAt: p.message.createdAt,
        sender: p.message.sender,
      },
    });
  } else if (event === CHAT_WS_EVENTS.MESSAGE_READ) {
    const p = payload as WsMessageReadPayload;
    store.markOptimisticRead(p.chatId, p.messageIds, p.readBy);
  } else if (event === CHAT_WS_EVENTS.REACTION_UPDATED) {
    const p = payload as WsReactionPayload;
    store.updateOptimisticReactions(p.chatId, p.messageId, p.reactions);
  }
}
