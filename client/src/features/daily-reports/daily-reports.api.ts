// src/features/daily-reports/daily-reports.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess, ResponseList } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export type DailyActivityType = "MONITORING" | "INSPECTION" | "FINDING" | "REPAIR" | "TEST_ACTIVITY" | "INFORMATION";

export interface DailyReportAttachment {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface DailyReportSummary {
  id: string;
  tankId: string;
  tankProcessId: string | null;
  reportDate: string;
  activityType: DailyActivityType;
  description: string | null;
  inspectorId: string | null;
  pertaminaPicId: string | null;
  aiSuggestedDescription: string | null;
  createdAt: string;
  updatedAt: string;
  tank: { id: string; tankNo: string; tankName: string | null; inspectionCompany: { id: string; name: string } | null };
  tankProcess: { id: string; name: string } | null;
  inspector: { id: string; name: string } | null;
  attachments: DailyReportAttachment[];
}

export type DailyReportDetail = DailyReportSummary;

export interface ListDailyReportsParams {
  tankId?: string;
  tankProcessId?: string;
  reportDate?: string;
  startDate?: string;
  endDate?: string;
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
  files: File[];
}

export interface UpdateDailyReportPayload {
  reportDate?: string;
  activityType?: DailyActivityType;
  description?: string;
  inspectorId?: string;
  pertaminaPicId?: string;
  newFiles?: File[];
  removedAttachmentIds?: string[];
  captions?: Array<{ attachmentId: string; caption: string }>;
}

export async function listDailyReports(params: ListDailyReportsParams): Promise<PaginatedResponse<DailyReportSummary>> {
  const res = await api.get<ResponseList<DailyReportSummary>>("/daily-reports", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getDailyReportById(id: string): Promise<DailyReportDetail> {
  const res = await api.get<ResponseSuccess<DailyReportDetail>>(`/daily-reports/${id}`);
  return res.data.data!;
}

export async function createDailyReport(payload: CreateDailyReportPayload): Promise<DailyReportDetail> {
  const formData = new FormData();
  formData.append("tankId", payload.tankId);
  if (payload.tankProcessId) formData.append("tankProcessId", payload.tankProcessId);
  formData.append("reportDate", payload.reportDate);
  formData.append("activityType", payload.activityType);
  formData.append("description", payload.description);
  if (payload.inspectorId) formData.append("inspectorId", payload.inspectorId);
  if (payload.pertaminaPicId) formData.append("pertaminaPicId", payload.pertaminaPicId);
  payload.files.forEach((file) => formData.append("attachments", file));
  const res = await api.post<ResponseSuccess<DailyReportDetail>>("/daily-reports", formData);
  return res.data.data!;
}

export async function updateDailyReport(id: string, payload: UpdateDailyReportPayload): Promise<DailyReportDetail> {
  const formData = new FormData();
  if (payload.reportDate) formData.append("reportDate", payload.reportDate);
  if (payload.activityType) formData.append("activityType", payload.activityType);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.inspectorId) formData.append("inspectorId", payload.inspectorId);
  if (payload.pertaminaPicId) formData.append("pertaminaPicId", payload.pertaminaPicId);
  (payload.newFiles ?? []).forEach((file) => formData.append("attachments", file));
  formData.append("removedAttachmentIds", JSON.stringify(payload.removedAttachmentIds ?? []));
  formData.append("captions", JSON.stringify(payload.captions ?? []));
  const res = await api.patch<ResponseSuccess<DailyReportDetail>>(`/daily-reports/${id}`, formData);
  return res.data.data!;
}

export async function deleteDailyReport(id: string): Promise<void> {
  await api.delete(`/daily-reports/${id}`);
}
