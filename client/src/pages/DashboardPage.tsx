// src/pages/DashboardPage.tsx
import { useNavigate } from "react-router-dom";
import { Container, AlertTriangle, CheckCircle, Clock, Activity, TrendingUp, Flame, ChevronRight, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import StatusBadge from "@/components/common/StatusBadge";
import { useDashboardSummary, useTankProgress, useDashboardFindings } from "@/features/dashboard/dashboard.query";
import { ROUTES } from "@/constants/route.constant";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  CRITICAL: { label: "Critical", color: "text-red-600", dot: "bg-red-500" },
  MAJOR: { label: "Major", color: "text-orange-600", dot: "bg-orange-500" },
  MINOR: { label: "Minor", color: "text-yellow-600", dot: "bg-yellow-500" },
  OBSERVATION: { label: "Observation", color: "text-blue-600", dot: "bg-blue-500" },
};

const FINDING_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-red-100 text-red-700" },
  IN_REPAIR: { label: "In Repair", color: "bg-yellow-100 text-yellow-700" },
  REPAIRED: { label: "Repaired", color: "bg-blue-100 text-blue-700" },
  VERIFIED: { label: "Verified", color: "bg-purple-100 text-purple-700" },
  CLOSED: { label: "Closed", color: "bg-green-100 text-green-700" },
};

function SummaryCard({ title, value, sub, icon: Icon, iconBg, iconColor, highlight }: { title: string; value: number; sub?: string; icon: React.ElementType; iconBg: string; iconColor: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-red-200 bg-red-50/30" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        <p className={`text-3xl font-bold ${highlight ? "text-red-600" : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 100 ? "bg-green-500" : value >= 60 ? "bg-blue-500" : value >= 30 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{value}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: tanks, isLoading: tanksLoading } = useTankProgress();
  const { data: findingsData, isLoading: findingsLoading } = useDashboardFindings();

  if (summaryLoading || tanksLoading || findingsLoading) return <LoadingState />;

  const completedTanks = tanks?.filter((t) => t.status === "COMPLETED").length ?? 0;
  const processCompletionRate = summary ? Math.round((summary.processes.completed / Math.max(summary.processes.total, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Tank overhaul progress overview — SSIE Internal Monitoring" />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="Total Tanks" value={summary.tanks.total} sub={`${summary.tanks.inProgress} in progress · ${completedTanks} completed`} icon={Container} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <SummaryCard title="Process Completion" value={summary.processes.completed} sub={`${processCompletionRate}% of ${summary.processes.total} total processes`} icon={CheckCircle} iconBg="bg-green-100" iconColor="text-green-600" />
          <SummaryCard title="Open Findings" value={summary.findings.open} sub={`${summary.findings.critical} critical`} icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600" highlight={summary.findings.critical > 0} />
          <SummaryCard title="Pending Reviews" value={summary.inspectionRequests.pending} sub="awaiting inspector review" icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tank Progress Table — spans 2 cols */}
        {tanks && tanks.length > 0 && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Tank Progress
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{tanks.length} tanks</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-y bg-muted/30">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tank</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Active Process</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-44">Progress</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Findings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tanks.map((row) => {
                      const activeProcess = row.processes?.find((p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE");
                      const tankId = row.tank?.id;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-muted/20 transition-colors ${tankId ? "cursor-pointer" : ""}`}
                          onClick={() => tankId && navigate(ROUTES.TANK_DETAIL.replace(":tankId", tankId))}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-mono font-semibold text-xs">{row.tank?.tankNo ?? "—"}</span>
                              {row.tank?.tankName && <p className="text-muted-foreground text-xs leading-none mt-0.5">{row.tank.tankName}</p>}
                              {row.contractorCompany && <p className="text-muted-foreground text-xs leading-none mt-0.5 hidden sm:block">{row.contractorCompany.name}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {activeProcess ? (
                              <div className="flex items-center gap-1.5">
                                <Activity className="h-3 w-3 text-blue-500 shrink-0" />
                                <span className="text-xs text-muted-foreground line-clamp-1">{activeProcess.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <ProgressBar value={row.progress} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row._count.findings > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                {row._count.findings}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Findings Summary Panel — 1 col */}
        {findingsData && (
          <div className="space-y-4">
            {/* By Severity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-muted-foreground" />
                  Findings by Severity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {findingsData.bySeverity.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No findings recorded.</p>
                ) : (
                  findingsData.bySeverity.map((item) => {
                    const cfg = SEVERITY_CONFIG[item.severity] ?? {
                      label: item.severity,
                      color: "text-muted-foreground",
                      dot: "bg-muted-foreground",
                    };
                    const total = findingsData.bySeverity.reduce((s, i) => s + i.count, 0);
                    const pct = Math.round((item.count / Math.max(total, 1)) * 100);
                    return (
                      <div key={item.severity} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                            <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <span className="tabular-nums text-muted-foreground">
                            {item.count}
                            <span className="ml-1 opacity-60">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* By Status */}
            {findingsData.byStatus.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Findings by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {findingsData.byStatus.map((item) => {
                      const cfg = FINDING_STATUS_CONFIG[item.status] ?? {
                        label: item.status.replace(/_/g, " "),
                        color: "bg-muted text-muted-foreground",
                      };
                      return (
                        <div key={item.status} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                          <span>{cfg.label}</span>
                          <span className="font-bold">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Recent Findings */}
      {findingsData && findingsData.recent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Recent Findings
              </CardTitle>
              <button onClick={() => navigate(ROUTES.FINDINGS)} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {findingsData.recent.map((f, idx) => {
                const sev = SEVERITY_CONFIG[f.severity] ?? {
                  label: f.severity,
                  color: "text-muted-foreground",
                  dot: "bg-muted",
                };
                const fsc = FINDING_STATUS_CONFIG[f.status] ?? {
                  label: f.status.replace(/_/g, " "),
                  color: "bg-muted text-muted-foreground",
                };
                return (
                  <div key={f.id}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${sev.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{f.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="font-mono">{f.tank.tankNo}</span>
                              {" · "}
                              {f.tankProcess.name}
                              {" · "}
                              {f.findingNo}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fsc.color}`}>{fsc.label}</span>
                            <span className={`text-xs font-medium ${sev.color}`}>{sev.label}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">{formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}</span>
                    </div>
                    {idx < findingsData.recent.length - 1 && null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
