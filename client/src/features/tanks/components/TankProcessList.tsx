// src/features/tanks/components/TankProcessList.tsx
import { Link } from "react-router-dom";
import { ChevronRight, Lock } from "lucide-react";
import ProcessStatusBadge from "@/components/common/ProcessStatusBadge";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { useTankProcesses } from "@/features/tank-processes/tank-processes.query";
import { ROUTES } from "@/constants/route.constant";
import { format } from "date-fns";

interface TankProcessListProps {
  tankId: string;
}

export default function TankProcessList({ tankId }: TankProcessListProps) {
  const { data: processes, isLoading, isError, refetch } = useTankProcesses(tankId);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load processes." onRetry={() => refetch()} />;
  if (!processes?.length) return <EmptyState title="No processes found" description="This tank has no process list yet." />;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Seq</th>
            <th className="px-4 py-3 text-left font-medium">Code</th>
            <th className="px-4 py-3 text-left font-medium">Process</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Checklist</th>
            <th className="px-4 py-3 text-left font-medium">Findings</th>
            <th className="px-4 py-3 text-left font-medium">Started</th>
            <th className="px-4 py-3 text-left font-medium">Completed</th>
            <th className="px-4 py-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {processes.map((proc) => {
            const detailPath = ROUTES.PROCESS_DETAIL.replace(":tankId", tankId).replace(":processId", proc.id);
            const isLocked = proc.status === "LOCKED";
            return (
              <tr key={proc.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 text-muted-foreground">{proc.sequenceOrder}</td>
                <td className="px-4 py-3 font-mono text-xs">{proc.processTemplate.code}</td>
                <td className="px-4 py-3 font-medium">
                  {proc.name}
                  {proc.processTemplate.isOptional && <span className="ml-1 text-xs text-muted-foreground">(optional)</span>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{proc.type}</td>
                <td className="px-4 py-3">
                  <ProcessStatusBadge status={proc.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{proc._count.checklistResults}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{proc._count.findings}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{proc.actualStartDate ? format(new Date(proc.actualStartDate), "dd MMM yyyy") : "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{proc.actualFinishDate ? format(new Date(proc.actualFinishDate), "dd MMM yyyy") : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {isLocked ? (
                    <Lock className="h-4 w-4 text-muted-foreground inline-block" />
                  ) : (
                    <Link to={detailPath} className="inline-flex items-center text-xs text-primary hover:underline">
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
