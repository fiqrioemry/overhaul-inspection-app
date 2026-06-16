// src/features/companies/companies.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList, ResponseOK } from "@/types/response.type";

export type CompanyType = "OWNER" | "INSPECTOR_COMPANY" | "CONTRACTOR";

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: CompanyType;
  isActive?: boolean;
  orderBy?: "name" | "type" | "createdAt";
  sortBy?: "asc" | "desc";
}

export interface CreateCompanyPayload {
  name: string;
  type: CompanyType;
  address?: string;
  phone?: string;
  email?: string;
  logo?: File;
  isActive?: boolean;
}

export interface UpdateCompanyPayload {
  name?: string;
  type?: CompanyType;
  address?: string;
  phone?: string;
  email?: string;
  logo?: File;
  isActive?: boolean;
}

export async function listCompanies(params: ListCompaniesParams): Promise<PaginatedResponse<Company>> {
  const res = await api.get<ResponseList<Company>>("/companies", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getCompanyById(id: string): Promise<Company> {
  const res = await api.get<ResponseSuccess<Company>>(`/companies/${id}`);
  return res.data.data!;
}

function toFormData(data: CreateCompanyPayload | UpdateCompanyPayload): FormData {
  const form = new FormData();
  if (data.name !== undefined) form.append("name", data.name);
  if (data.type !== undefined) form.append("type", data.type);
  if (data.address !== undefined) form.append("address", data.address);
  if (data.phone !== undefined) form.append("phone", data.phone);
  if (data.email !== undefined) form.append("email", data.email);
  if (data.isActive !== undefined) form.append("isActive", String(data.isActive));
  if (data.logo instanceof File) form.append("logo", data.logo);
  return form;
}

export async function createCompany(data: CreateCompanyPayload): Promise<Company> {
  const res = await api.post<ResponseSuccess<Company>>("/companies", toFormData(data));
  return res.data.data!;
}

export async function updateCompany(id: string, data: UpdateCompanyPayload): Promise<Company> {
  const res = await api.patch<ResponseSuccess<Company>>(`/companies/${id}`, toFormData(data));
  return res.data.data!;
}

export async function deleteCompany(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/companies/${id}`);
  return res.data;
}
