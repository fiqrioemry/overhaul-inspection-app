// src/pages/DashboardPage.tsx
import { useNavigate } from "react-router-dom";
import { Container, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import StatusBadge from "@/components/common/StatusBadge";
import { useDashboardSummary, useTankProgress } from "@/features/dashboard/dashboard.query";
import { ROUTES } from "@/constants/route.constant";

function SummaryCard({ title, value, sub, icon: Icon, color }: { title: string; value: number; sub?: string; icon: React.ElementType; color?: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`rounded-lg p-2.5 ${color ?? "bg-muted"}`}>
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: tanks, isLoading: tanksLoading } = useTankProgress();

  if (summaryLoading || tanksLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Tank overhaul progress overview" />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Tanks"
            value={summary.tanks.total}
            sub={`${summary.tanks.inProgress} in progress`}
            icon={Container}
            color="bg-blue-50"
          />
          <SummaryCard
            title="Completed Processes"
            value={summary.processes.completed}
            sub={`of ${summary.processes.total} total`}
            icon={CheckCircle}
            color="bg-green-50"
          />
          <SummaryCard
            title="Open Findings"
            value={summary.findings.open}
            sub={`${summary.findings.critical} critical`}
            icon={AlertTriangle}
            color="bg-red-50"
          />
          <SummaryCard
            title="Pending Reviews"
            value={summary.inspectionRequests.pending}
            sub="awaiting inspector review"
            icon={Clock}
            color="bg-amber-50"
          />
        </div>
      )}

      {tanks && tanks.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Tank Progress</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tank No.</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Contractor</th>
                  <th className="px-4 py-3 text-left font-medium w-52">Progress</th>
                  <th className="px-4 py-3 text-right font-medium">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tanks.map((tank) => (
                  <tr
                    key={tank.id}
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => navigate(ROUTES.TANK_DETAIL.replace(":tankId", tank.id))}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium">{tank.tankNo}</span>
                      {tank.tankName && <span className="text-muted-foreground ml-2 text-xs">{tank.tankName}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tank.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tank.contractorCompany?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-40 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${tank.progress}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{tank.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tank._count.findings > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          {tank._count.findings}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
