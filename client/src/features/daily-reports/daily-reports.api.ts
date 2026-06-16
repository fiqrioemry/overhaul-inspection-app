// src/features/daily-reports/daily-reports.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export type DailyActivityType = "GENERAL" | "FABRICATION" | "INSPECTION" | "TESTING" | "COATING" | "COMMISSIONING" | "REPAIR" | "OTHER";

export interface DailyReportSummary {
  id: string;
  tankId: string;
  tankProcessId: string | null;
  reportDate: string;
  activityType: DailyActivityType;
  description: string;
  createdAt: string;
  updatedAt: string;
  tank: { id: string; tankNo: string; tankName: string | null };
  tankProcess: { id: string; name: string } | null;
  inspector: { id: string; name: string } | null;
}

export interface DailyReportDetail extends DailyReportSummary {
  pertaminaPicId: string | null;
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
  tankId?: string;
  tankProcessId?: string;
  reportDate?: string;
  activityType?: DailyActivityType;
  description?: string;
  inspectorId?: string;
  pertaminaPicId?: string;
  fileIds?: string[];
}

export async function listDailyReports(params: ListDailyReportsParams): Promise<PaginatedResponse<DailyReportSummary>> {
  const res = await api.get<ResponseSuccess<PaginatedResponse<DailyReportSummary>>>("/daily-reports", { params });
  return res.data.data!;
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
