// src/features/inspection-requests/inspection-requests.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList } from "@/types/response.type";

export type InspectionRequestStatus = "SUBMITTED" | "REVIEWED" | "RETURNED" | "CANCELLED";

export interface InspectionRequestProcess {
  id: string;
  tank: { id: string; tankNo: string; tankName: string | null };
  processTemplate: { id: string; code: string; name: string };
}

export interface InspectionRequestSummary {
  id: string;
  requestNo: string;
  title: string;
  description: string | null;
  status: InspectionRequestStatus;
  submittedAt: string;
  reviewedAt: string | null;
  tankProcess: InspectionRequestProcess;
  submittedBy: { id: string; name: string } | null;
  reviewedBy: { id: string; name: string } | null;
}

export interface InspectionRequestDetail extends InspectionRequestSummary {
  notes: string | null;
}

export interface ListInspectionRequestsParams {
  page?: number;
  limit?: number;
  status?: InspectionRequestStatus;
  tankId?: string;
}

export interface CreateInspectionRequestPayload {
  tankProcessId: string;
  title: string;
  description?: string;
}

export interface ReviewInspectionRequestPayload {
  action: "REVIEWED" | "RETURNED";
  notes?: string;
}

export async function listInspectionRequests(params: ListInspectionRequestsParams): Promise<PaginatedResponse<InspectionRequestSummary>> {
  const res = await api.get<ResponseList<InspectionRequestSummary>>("/inspection-requests", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getInspectionRequestById(id: string): Promise<InspectionRequestDetail> {
  const res = await api.get<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}`);
  return res.data.data!;
}

export async function createInspectionRequest(data: CreateInspectionRequestPayload): Promise<InspectionRequestDetail> {
  const res = await api.post<ResponseSuccess<InspectionRequestDetail>>("/inspection-requests", data);
  return res.data.data!;
}

export async function reviewInspectionRequest(id: string, data: ReviewInspectionRequestPayload): Promise<InspectionRequestDetail> {
  const res = await api.patch<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}/review`, data);
  return res.data.data!;
}

export async function cancelInspectionRequest(id: string): Promise<InspectionRequestDetail> {
  const res = await api.patch<ResponseSuccess<InspectionRequestDetail>>(`/inspection-requests/${id}/cancel`, {});
  return res.data.data!;
}
