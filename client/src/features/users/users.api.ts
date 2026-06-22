// src/features/users/users.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList, ResponseOK } from "@/types/response.type";
import type { RoleEnum, StatusEnum } from "@/types/users.type";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
  status: StatusEnum;
  avatar: string | null;
  verifiedAt: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export type UserDetail = UserListItem;

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: RoleEnum;
  status: StatusEnum;
  password?: string;
  isVerified?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  role?: RoleEnum;
  avatar?: File;
}

export interface UpdateUserStatusPayload {
  status: StatusEnum;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResponse<UserListItem>> {
  const res = await api.get<ResponseList<UserListItem>>("/users", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getUserById(id: string): Promise<UserDetail> {
  const res = await api.get<ResponseSuccess<UserDetail>>(`/users/${id}`);
  return res.data.data!;
}

export async function createUser(data: CreateUserPayload): Promise<UserDetail> {
  const res = await api.post<ResponseSuccess<UserDetail>>("/users", data);
  return res.data.data!;
}

export async function updateUser(id: string, data: UpdateUserPayload): Promise<UserDetail> {
  const formData = new FormData();
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.role !== undefined) formData.append("role", data.role);
  if (data.avatar instanceof File) formData.append("avatar", data.avatar);
  const res = await api.patch<ResponseSuccess<UserDetail>>(`/users/${id}`, formData);
  return res.data.data!;
}

export async function updateUserStatus(id: string, data: UpdateUserStatusPayload): Promise<ResponseOK> {
  const res = await api.patch<ResponseOK>(`/users/${id}/status`, data);
  return res.data;
}

export async function deleteUser(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/users/${id}`);
  return res.data;
}

export type CompanyTypeFilter = "OWNER" | "INSPECTOR_COMPANY" | "CONTRACTOR";

export interface UserOption {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
  position: string | null;
  companyId: string | null;
  company: { id: string; name: string; type: CompanyTypeFilter } | null;
}

export interface UserOptionsParams {
  companyType?: CompanyTypeFilter;
  role?: string;
  search?: string;
}

export async function getUserOptions(params: UserOptionsParams): Promise<UserOption[]> {
  const res = await api.get<ResponseSuccess<UserOption[]>>("/users/options", { params });
  return res.data.data!;
}
