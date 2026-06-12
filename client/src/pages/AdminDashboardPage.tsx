import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { useAdminStats } from "@/features/admin/admin.query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Flag, ShieldAlert, MessageSquare, UserCheck, UserX } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  isLoading: boolean;
  colorClass?: string;
}

function StatCard({ title, value, icon: Icon, isLoading, colorClass = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`size-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value?.toLocaleString() ?? "—"}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { t } = useTranslation(["admin"]);
  const { data: stats, isLoading } = useAdminStats();

  return (
    <>
      <Helmet>
        <title>{t("admin:dashboardTitle")} — Admin</title>
      </Helmet>

      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("admin:dashboardTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin:dashboardSubtitle")}</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t("admin:statTotalUsers")} value={stats?.totalUsers} icon={Users} isLoading={isLoading} />
          <StatCard title={t("admin:statActiveUsers")} value={stats?.activeUsers} icon={UserCheck} isLoading={isLoading} colorClass="text-green-500" />
          <StatCard title={t("admin:statBannedUsers")} value={stats?.bannedUsers} icon={UserX} isLoading={isLoading} colorClass="text-red-500" />
          <StatCard title={t("admin:statTotalPosts")} value={stats?.totalPosts} icon={FileText} isLoading={isLoading} />
          <StatCard title={t("admin:statTotalReports")} value={stats?.totalReports} icon={Flag} isLoading={isLoading} />
          <StatCard title={t("admin:statPendingReports")} value={stats?.pendingReports} icon={ShieldAlert} isLoading={isLoading} colorClass="text-amber-500" />
          <StatCard title={t("admin:statTotalChats")} value={stats?.totalChats} icon={MessageSquare} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
}
