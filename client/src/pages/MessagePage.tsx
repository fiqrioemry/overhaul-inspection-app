// src/pages/MessagePage.tsx

import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat.store";
import { useChatSocket } from "@/hooks/useChatSocket";
import ChatList from "@/features/chats/components/ChatList";
import ChatWindow from "@/features/chats/components/ChatWindow";
import ChatEmptyState from "@/features/chats/components/ChatEmptyState";

export default function MessagePage() {
  const { activeChatId, setActiveChatId, isSidebarCollapsed, setSidebarCollapsed } = useChatStore();

  // Connect to global WS for notifications
  useChatSocket({});

  // Per-chat WS when a chat is open
  useChatSocket({ chatId: activeChatId ?? undefined });

  function handleSelectChat(chatId: string) {
    setActiveChatId(chatId);
    setSidebarCollapsed(true); // on mobile, collapse sidebar
  }

  return (
    <div className="flex  h-[calc(100vh-0px)] md:h-[calc(100vh-0px)] overflow-hidden -mx-4 md:-mx-6 -my-6">
      {/* Sidebar / Chat List */}
      <aside
        className={cn(
          "flex-shrink-0 border-r border-border transition-all duration-200",
          // Mobile: full width when no chat selected, hidden when chat is open
          "w-full md:w-80 xl:w-96",
          isSidebarCollapsed ? "hidden md:flex" : "flex",
          "flex-col h-full",
        )}
      >
        <ChatList onSelectChat={handleSelectChat} />
      </aside>

      {/* Chat Window */}
      <main
        className={cn(
          "flex-1 min-w-0 relative",
          // Mobile: show only when chat is selected
          activeChatId && isSidebarCollapsed ? "flex" : "hidden md:flex",
          "flex-col h-full",
        )}
      >
        {activeChatId ? <ChatWindow key={activeChatId} chatId={activeChatId} /> : <ChatEmptyState />}
      </main>
    </div>
  );
}
