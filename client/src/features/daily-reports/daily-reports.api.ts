// src/features/daily-reports/daily-reports.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess, ResponseList } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export interface AIGeneratePayload {
  tankId?: string;
  activityType: DailyActivityType;
  processName?: string;
  location?: string;
  descriptionDraft?: string;
  recommendationDraft?: string;
  files: File[];
}

export interface TankOption {
  id: string;
  tankNo: string;
  tankName: string | null;
}

export interface TankProcessOption {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface AIGenerateResult {
  description: string;
  recommendation: string | null;
  captions: string[];
  relevanceWarning: boolean;
  confidence?: number;
  notes?: string[];
}

export type DailyActivityType = "MONITORING" | "INSPECTION";

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
  tankId: string | null;
  projectId: string | null;
  tankProcessId: string | null;
  reportDate: string;
  activityType: DailyActivityType;
  description: string | null;
  recommendation: string | null;
  inspectorId: string | null;
  pertaminaPicId: string | null;
  aiSuggestedDescription: string | null;
  createdAt: string;
  updatedAt: string;
  tank: {
    id: string;
    tankNo: string;
    tankName: string | null;
    location: string | null;
  } | null;
  project: {
    id: string;
    projectNo: string;
    type: string;
    status: string;
    inspectionCompany: { id: string; name: string; logoFile: { url: string } | null } | null;
    contractorCompany: { id: string; name: string; logoFile: { url: string } | null } | null;
  } | null;
  tankProcess: { id: string; name: string; type?: string } | null;
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
  tankId?: string;
  tankProcessId?: string;
  reportDate: string;
  activityType: DailyActivityType;
  description: string;
  recommendation?: string;
  inspectorId?: string;
  pertaminaPicId?: string;
  files: File[];
  newFileCaptions?: string[];
}

export interface UpdateDailyReportPayload {
  reportDate?: string;
  activityType?: DailyActivityType;
  description?: string;
  recommendation?: string | null;
  inspectorId?: string;
  pertaminaPicId?: string;
  newFiles?: File[];
  removedAttachmentIds?: string[];
  captions?: Array<{ attachmentId: string; caption: string }>;
  sortOrders?: Array<{ attachmentId: string; sortOrder: number }>;
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
  if (payload.tankId) formData.append("tankId", payload.tankId);
  if (payload.tankProcessId) formData.append("tankProcessId", payload.tankProcessId);
  formData.append("reportDate", payload.reportDate);
  formData.append("activityType", payload.activityType);
  formData.append("description", payload.description);
  if (payload.recommendation) formData.append("recommendation", payload.recommendation);
  if (payload.inspectorId) formData.append("inspectorId", payload.inspectorId);
  if (payload.pertaminaPicId) formData.append("pertaminaPicId", payload.pertaminaPicId);
  payload.files.forEach((file) => formData.append("attachments", file));
  if (payload.newFileCaptions && payload.newFileCaptions.length > 0) {
    formData.append("newFileCaptions", JSON.stringify(payload.newFileCaptions));
  }
  const res = await api.post<ResponseSuccess<DailyReportDetail>>("/daily-reports", formData);
  return res.data.data!;
}

export async function updateDailyReport(id: string, payload: UpdateDailyReportPayload): Promise<DailyReportDetail> {
  const formData = new FormData();
  if (payload.reportDate) formData.append("reportDate", payload.reportDate);
  if (payload.activityType) formData.append("activityType", payload.activityType);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.recommendation !== undefined) formData.append("recommendation", payload.recommendation ?? "");
  if (payload.inspectorId) formData.append("inspectorId", payload.inspectorId);
  if (payload.pertaminaPicId) formData.append("pertaminaPicId", payload.pertaminaPicId);
  (payload.newFiles ?? []).forEach((file) => formData.append("attachments", file));
  formData.append("removedAttachmentIds", JSON.stringify(payload.removedAttachmentIds ?? []));
  formData.append("captions", JSON.stringify(payload.captions ?? []));
  if (payload.sortOrders && payload.sortOrders.length > 0) {
    formData.append("sortOrders", JSON.stringify(payload.sortOrders));
  }
  const res = await api.patch<ResponseSuccess<DailyReportDetail>>(`/daily-reports/${id}`, formData);
  return res.data.data!;
}

export async function deleteDailyReport(id: string): Promise<void> {
  await api.delete(`/daily-reports/${id}`);
}

export async function generateAIDailyReport(payload: AIGeneratePayload): Promise<AIGenerateResult> {
  const formData = new FormData();
  if (payload.tankId) formData.append("tankId", payload.tankId);
  formData.append("activityType", payload.activityType);
  if (payload.processName) formData.append("processName", payload.processName);
  if (payload.location) formData.append("location", payload.location);
  if (payload.descriptionDraft) formData.append("descriptionDraft", payload.descriptionDraft);
  if (payload.recommendationDraft) formData.append("recommendationDraft", payload.recommendationDraft);
  payload.files.forEach((file) => formData.append("attachments", file));
  const res = await api.post<ResponseSuccess<AIGenerateResult>>("/daily-reports/ai/generate", formData);
  return res.data.data!;
}

export async function listTankOptions(): Promise<TankOption[]> {
  const res = await api.get<ResponseSuccess<TankOption[]>>("/daily-reports/options/tanks");
  return res.data.data!;
}

export async function listTankProcessOptions(tankId: string): Promise<TankProcessOption[]> {
  const res = await api.get<ResponseSuccess<TankProcessOption[]>>("/daily-reports/options/tank-processes", {
    params: { tankId },
  });
  return res.data.data!;
}
