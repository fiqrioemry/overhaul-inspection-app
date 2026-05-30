// src/features/chats/components/ChatEmptyState.tsx
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChatEmptyState() {
  const { t } = useTranslation(["chat"]);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="relative">
        <div className="size-20 rounded-3xl bg-muted flex items-center justify-center">
          <MessageCircle size={36} className="text-muted-foreground/60" />
        </div>
        <div className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-lg leading-none">✦</span>
        </div>
      </div>
      <div>
        <p className="font-semibold text-foreground">{t("chat:noConversationsYet")}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">{t("chat:startNewChat")}</p>
      </div>
    </div>
  );
}
