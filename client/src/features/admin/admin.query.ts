import { toast } from "sonner";
import i18n from "@/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReports, updateReport, fetchAdminUsers, updateUserStatus, fetchStats } from "./admin.api";
import type { GetReportsParams, GetAdminUsersParams, UpdateReportPayload, UpdateUserStatusPayload } from "@/types/admin.type";

export const ADMIN_KEYS = {
  stats: ["admin", "stats"] as const,
  reports: (params?: GetReportsParams) => ["admin", "reports", params] as const,
  users: (params?: GetAdminUsersParams) => ["admin", "users", params] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: fetchStats,
    select: (res) => res.data,
    staleTime: 1000 * 60,
  });
}

export function useAdminReports(params: GetReportsParams = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.reports(params),
    queryFn: () => fetchReports(params),
    staleTime: 1000 * 30,
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: string; payload: UpdateReportPayload }) => updateReport(reportId, payload),
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_REPORT_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
}

export function useAdminUsers(params: GetAdminUsersParams = {}) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(params),
    queryFn: () => fetchAdminUsers(params),
    staleTime: 1000 * 30,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserStatusPayload }) => updateUserStatus(userId, payload),
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_USER_STATUS_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
