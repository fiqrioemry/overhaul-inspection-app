import api from "@/lib/axios";
import { ADMIN_ENDPOINTS } from "@/constants/admin.constant";
import type { ResponseSuccess } from "@/types/response.type";
import type {
  AdminReportItem,
  AdminUserItem,
  AdminStats,
  GetReportsParams,
  GetAdminUsersParams,
  UpdateReportPayload,
  UpdateUserStatusPayload,
} from "@/types/admin.type";

export async function fetchReports(params: GetReportsParams = {}): Promise<ResponseSuccess<AdminReportItem[]>> {
  const res = await api.get(ADMIN_ENDPOINTS.reports, { params });
  return res.data;
}

export async function updateReport(reportId: string, payload: UpdateReportPayload): Promise<ResponseSuccess<AdminReportItem>> {
  const res = await api.patch(ADMIN_ENDPOINTS.report(reportId), payload);
  return res.data;
}

export async function fetchAdminUsers(params: GetAdminUsersParams = {}): Promise<ResponseSuccess<AdminUserItem[]>> {
  const res = await api.get(ADMIN_ENDPOINTS.users, { params });
  return res.data;
}

export async function updateUserStatus(userId: string, payload: UpdateUserStatusPayload): Promise<ResponseSuccess<AdminUserItem>> {
  const res = await api.patch(ADMIN_ENDPOINTS.userStatus(userId), payload);
  return res.data;
}

export async function fetchStats(): Promise<ResponseSuccess<AdminStats>> {
  const res = await api.get(ADMIN_ENDPOINTS.stats);
  return res.data;
}
