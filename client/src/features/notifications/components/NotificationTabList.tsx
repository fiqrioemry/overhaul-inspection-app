import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NotificationType } from "@/types/notifications.type";

type TabValue = NotificationType | "";

interface Tab {
  label: string;
  value: TabValue;
}

const TABS: Tab[] = [
  { label: "All", value: "" },
  { label: "Comments", value: "COMMENT" },
  { label: "Likes", value: "LIKE" },
  { label: "Follows", value: "FOLLOW" },
  { label: "Mentions", value: "MENTION" },
  { label: "Messages", value: "MESSAGE" },
];

interface NotificationTabListProps {
  value: TabValue;
  onChange: (value: TabValue) => void;
  className?: string;
}

export default function NotificationTabList({ value, onChange, className }: NotificationTabListProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TabValue)} className={cn("w-full", className)}>
      <TabsList className="w-full h-auto p-1 bg-muted/50 gap-0.5 flex overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "flex-1 min-w-fit text-xs sm:text-sm px-3 py-1.5 rounded-md whitespace-nowrap",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm",
              "data-[state=active]:text-foreground text-muted-foreground",
              "transition-all duration-150",
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
