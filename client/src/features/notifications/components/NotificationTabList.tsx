import { cn } from "@/lib/utils";
import { useGetFollowRequests } from "@/features/users/users.query";
import { useTranslation } from "react-i18next";

type TabType = "FOLLOW" | "LIKE" | "COMMENT" | "MENTION" | "REQUEST" | "";

interface NotificationTabListProps {
  value: TabType;
  onChange: (value: TabType) => void;
}

export default function NotificationTabList({ value, onChange }: NotificationTabListProps) {
  const { t } = useTranslation(["notif"]);
  const TABS: { label: string; value: TabType }[] = [
    { label: t("notif:all"), value: "" },
    { label: t("notif:follows"), value: "FOLLOW" },
    { label: t("notif:requests"), value: "REQUEST" },
    { label: t("notif:likes"), value: "LIKE" },
    { label: t("notif:comments"), value: "COMMENT" },
    { label: t("notif:mentions"), value: "MENTION" },
  ];
  const { data: requestsData } = useGetFollowRequests();
  const requestCount = requestsData?.data?.length ?? 0;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "shrink-0 relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            value === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
          )}
        >
          {tab.label}
          {tab.value === "REQUEST" && requestCount > 0 && (
            <span
              className={cn("ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-semibold min-w-[16px] h-4 px-1", value === "REQUEST" ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground")}
            >
              {requestCount > 99 ? "99+" : requestCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export type { TabType };
