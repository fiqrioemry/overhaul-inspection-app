// src/features/reference-documents/reference-documents.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList, ResponseOK } from "@/types/response.type";

export interface ReferenceDocument {
  id: string;
  code: string;
  title: string;
  documentType: string;
  revision: string | null;
  issuer: string | null;
  status: string;
  createdAt: string;
}

export interface ListReferenceDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  documentType?: string;
}

export interface CreateReferenceDocumentPayload {
  code: string;
  title: string;
  documentType: string;
  revision?: string;
  issuer?: string;
  status?: string;
}

export interface UpdateReferenceDocumentPayload {
  code?: string;
  title?: string;
  documentType?: string;
  revision?: string;
  issuer?: string;
  status?: string;
}

export async function listReferenceDocuments(params: ListReferenceDocumentsParams): Promise<PaginatedResponse<ReferenceDocument>> {
  const res = await api.get<ResponseList<ReferenceDocument>>("/reference-documents", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getAllReferenceDocuments(): Promise<ReferenceDocument[]> {
  const res = await api.get<ResponseList<ReferenceDocument>>("/reference-documents", { params: { limit: 1000 } });
  return res.data.data;
}

export async function createReferenceDocument(data: CreateReferenceDocumentPayload): Promise<ReferenceDocument> {
  const res = await api.post<ResponseSuccess<ReferenceDocument>>("/reference-documents", data);
  return res.data.data!;
}

export async function updateReferenceDocument(id: string, data: UpdateReferenceDocumentPayload): Promise<ReferenceDocument> {
  const res = await api.patch<ResponseSuccess<ReferenceDocument>>(`/reference-documents/${id}`, data);
  return res.data.data!;
}

export async function deleteReferenceDocument(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/reference-documents/${id}`);
  return res.data;
}
