import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { CHAT_KEYS } from "@/features/chats/chats.query";
import { handleChatWsEvent } from "@/stores/chat.store";

const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:5000/ws";

interface UseChatSocketOptions {
  chatId?: string;
}

export function useChatSocket({ chatId }: UseChatSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const url = chatId ? `${WS_BASE_URL}?chatId=${chatId}` : WS_BASE_URL;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] connected", url);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        const { event: wsEvent, chatId: payloadChatId } = payload;

        handleChatWsEvent(wsEvent, payload, user.id);

        // Invalidate queries for real-time sync
        if (payloadChatId) {
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(payloadChatId),
          });
          queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
        }
      } catch (err) {
        console.warn("[WS] failed to parse message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] error:", err);
    };

    ws.onclose = () => {
      console.log("[WS] disconnected");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [chatId, user, queryClient]);

  return wsRef;
}

export function useNotificationSocket() {
  return useChatSocket({});
}
