// src/features/daily-reports/daily-reports.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess, ResponseList } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export type DailyActivityType = "MONITORING" | "INSPECTION" | "FINDING" | "REPAIR" | "TEST_ACTIVITY" | "INFORMATION";

export interface DailyReportSummary {
  id: string;
  tankId: string;
  tankProcessId: string | null;
  reportDate: string;
  activityType: DailyActivityType;
  description: string | null;
  inspectorId: string | null;
  pertaminaPicId: string | null;
  createdAt: string;
  updatedAt: string;
  tank: { id: string; tankNo: string; tankName: string | null };
  tankProcess: { id: string; name: string } | null;
  inspector: { id: string; name: string } | null;
}

export interface DailyReportDetail extends DailyReportSummary {
  attachments: { id: string; url: string; path: string; module: string; isUsed: boolean; createdAt: string }[];
}

export interface ListDailyReportsParams {
  tankId?: string;
  tankProcessId?: string;
  reportDate?: string;
  activityType?: DailyActivityType;
  page?: number;
  limit?: number;
}

export interface CreateDailyReportPayload {
  tankId: string;
  tankProcessId?: string;
  reportDate: string;
  activityType: DailyActivityType;
  description: string;
  inspectorId?: string;
  pertaminaPicId?: string;
  fileIds?: string[];
}

export interface UpdateDailyReportPayload {
  reportDate?: string;
  activityType?: DailyActivityType;
  description?: string;
  fileIds?: string[];
}

export async function listDailyReports(params: ListDailyReportsParams): Promise<PaginatedResponse<DailyReportSummary>> {
  const res = await api.get<ResponseList<DailyReportSummary>>("/daily-reports", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getDailyReportById(id: string): Promise<DailyReportDetail> {
  const res = await api.get<ResponseSuccess<DailyReportDetail>>(`/daily-reports/${id}`);
  return res.data.data!;
}

export async function createDailyReport(data: CreateDailyReportPayload): Promise<DailyReportDetail> {
  const res = await api.post<ResponseSuccess<DailyReportDetail>>("/daily-reports", data);
  return res.data.data!;
}

export async function updateDailyReport(id: string, data: UpdateDailyReportPayload): Promise<DailyReportDetail> {
  const res = await api.patch<ResponseSuccess<DailyReportDetail>>(`/daily-reports/${id}`, data);
  return res.data.data!;
}

export async function deleteDailyReport(id: string): Promise<void> {
  await api.delete(`/daily-reports/${id}`);
}
