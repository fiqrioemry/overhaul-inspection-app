// src/pages/UserAuditLogPage.tsx
import { useState } from "react";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import { useUserById } from "@/features/users/users.query";
import { useUserAuditLog } from "@/features/users/users.query";
import type { UserActivityLogItem } from "@/features/users/users.api";
import { ROUTES } from "@/constants/route.constant";

function formatActionLabel(action: string) {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ActivityMetadata({ metadata }: { metadata: UserActivityLogItem["metadata"] }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-md">
      {Object.entries(metadata).map(([key, value]) => {
        const text = `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`;
        return (
          <Badge key={key} variant="outline" title={text} className="max-w-full text-xs font-normal">
            <span className="truncate">{text}</span>
          </Badge>
        );
      })}
    </div>
  );
}

export default function UserAuditLogPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: user, isLoading: isUserLoading, isError: isUserError, refetch: refetchUser } = useUserById(id!);
  const { data, isLoading, isError, refetch } = useUserAuditLog(id!, { page, limit: 20 });

  if (isUserLoading) return <LoadingState />;
  if (isUserError || !user) return <ErrorState message="Failed to load user." onRetry={() => refetchUser()} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.USERS)}>
        <ArrowLeft /> Back to Users
      </Button>

      <PageHeader title="Audit Log" description={`Activity history for ${user.name} (${user.email})`} />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load audit log." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!data?.items?.length ? (
            <EmptyState title="No activity found" description="This user has no recorded activity yet." icon={History} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Details</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {formatActionLabel(log.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ActivityMetadata metadata={log.metadata} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
