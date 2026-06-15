// src/features/companies/companies.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseOK } from "@/types/response.type";

export interface Company {
  id: string;
  name: string;
  role: string;
  logoUrl: string | null;
  status: string;
  createdAt: string;
}

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateCompanyPayload {
  name: string;
  role: string;
  status?: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  role?: string;
  status?: string;
}

export async function listCompanies(params: ListCompaniesParams): Promise<PaginatedResponse<Company>> {
  const res = await api.get<ResponseSuccess<PaginatedResponse<Company>>>("/companies", { params });
  return res.data.data!;
}

export async function createCompany(data: CreateCompanyPayload): Promise<Company> {
  const res = await api.post<ResponseSuccess<Company>>("/companies", data);
  return res.data.data!;
}

export async function updateCompany(id: string, data: UpdateCompanyPayload): Promise<Company> {
  const res = await api.patch<ResponseSuccess<Company>>(`/companies/${id}`, data);
  return res.data.data!;
}

export async function deleteCompany(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/companies/${id}`);
  return res.data;
}
