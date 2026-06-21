// src/features/tanks/tanks.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList, ResponseOK } from "@/types/response.type";

export interface TankCompany {
  id: string;
  name: string;
  role: string;
}

export interface ShellCourse {
  id: string;
  courseNo: number;
  thicknessMm: number;
  plateDimension: string | null;
  remarks: string | null;
}

export interface TankAttachment {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export type TankLocation = "SUNGAI_GERONG" | "PLADJU";
export type TankService =
  | "AVTUR" | "NAPTHA" | "PREMIUM" | "PERTALITE" | "PERTAMAX" | "PERTAMAX_TURBO"
  | "SOLAR" | "DEXLITE" | "PERTAMINA_DEX" | "KEROSENE" | "CRUDE_OIL"
  | "FUEL_OIL" | "LUBRICATING_OIL" | "LPG" | "CONDENSATE" | "SLOP_OIL" | "OTHER";

export interface TankSummary {
  id: string;
  tankNo: string;
  tankName: string | null;
  location: TankLocation | null;
  capacityM3: number | null;
  service: TankService | null;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number;
  hasSteamCoil: boolean;
  startDate: string | null;
  estimatedFinishDate: string | null;
  status: string;
  createdAt: string;
  contractorCompany: TankCompany | null;
  inspectionCompany: TankCompany | null;
  _count: { tankProcesses: number };
}

export interface TankDetail extends TankSummary {
  shellCourses: ShellCourse[];
  attachments: TankAttachment[];
}

export interface TankExtractResult {
  tankNo: string | null;
  tankName: string | null;
  location: TankLocation | null;
  capacityM3: number | null;
  service: TankService | null;
  diameterMm: number | null;
  heightMm: number | null;
  shellCourseCount: number | null;
  bottomPlateDimension: string | null;
  hasSteamCoil: boolean | null;
  startDate: string | null;
  estimatedFinishDate: string | null;
  shellCourses: Array<{ courseNo: number; thicknessMm?: number; plateDimension?: string; remarks?: string }>;
  relevanceWarning: boolean;
}

export interface ListTanksParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ShellCourseInput {
  courseNo: number;
  thicknessMm: number;
  plateDimension?: string;
  remarks?: string;
}

export interface CreateTankPayload {
  tankNo: string;
  tankName?: string;
  location?: TankLocation;
  capacityM3?: number;
  service?: TankService;
  diameterMm?: number;
  heightMm?: number;
  shellCourseCount: number;
  hasSteamCoil?: boolean;
  contractorCompanyId?: string;
  inspectionCompanyId?: string;
  startDate?: string;
  estimatedFinishDate?: string;
  shellCourses?: ShellCourseInput[];
  files?: File[];
  newFileCaptions?: string[];
}

export interface UpdateTankPayload {
  tankNo?: string;
  tankName?: string;
  location?: TankLocation;
  capacityM3?: number;
  service?: TankService;
  diameterMm?: number;
  heightMm?: number;
  contractorCompanyId?: string;
  inspectionCompanyId?: string;
  startDate?: string;
  estimatedFinishDate?: string;
}

export async function listTanks(params: ListTanksParams): Promise<PaginatedResponse<TankSummary>> {
  const res = await api.get<ResponseList<TankSummary>>("/tanks", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getTankById(id: string): Promise<TankDetail> {
  const res = await api.get<ResponseSuccess<TankDetail>>(`/tanks/${id}`);
  return res.data.data!;
}

export async function createTank(data: CreateTankPayload): Promise<TankDetail> {
  const { files, newFileCaptions, ...rest } = data;

  // When document attachments are present, send multipart/form-data; otherwise JSON.
  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("tankNo", rest.tankNo);
    if (rest.tankName) formData.append("tankName", rest.tankName);
    if (rest.location) formData.append("location", rest.location);
    if (rest.capacityM3 !== undefined) formData.append("capacityM3", String(rest.capacityM3));
    if (rest.service) formData.append("service", rest.service);
    if (rest.diameterMm !== undefined) formData.append("diameterMm", String(rest.diameterMm));
    if (rest.heightMm !== undefined) formData.append("heightMm", String(rest.heightMm));
    formData.append("shellCourseCount", String(rest.shellCourseCount));
    if (rest.hasSteamCoil !== undefined) formData.append("hasSteamCoil", String(rest.hasSteamCoil));
    if (rest.contractorCompanyId) formData.append("contractorCompanyId", rest.contractorCompanyId);
    if (rest.inspectionCompanyId) formData.append("inspectionCompanyId", rest.inspectionCompanyId);
    if (rest.startDate) formData.append("startDate", rest.startDate);
    if (rest.estimatedFinishDate) formData.append("estimatedFinishDate", rest.estimatedFinishDate);
    if (rest.shellCourses && rest.shellCourses.length > 0) {
      formData.append("shellCourses", JSON.stringify(rest.shellCourses));
    }
    if (newFileCaptions && newFileCaptions.length > 0) {
      formData.append("newFileCaptions", JSON.stringify(newFileCaptions));
    }
    files.forEach((file) => formData.append("attachments", file));
    const res = await api.post<ResponseSuccess<TankDetail>>("/tanks", formData);
    return res.data.data!;
  }

  const res = await api.post<ResponseSuccess<TankDetail>>("/tanks", rest);
  return res.data.data!;
}

export async function extractTankDocument(files: File[]): Promise<TankExtractResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("attachments", file));
  const res = await api.post<ResponseSuccess<TankExtractResult>>("/tanks/ai/extract", formData);
  return res.data.data!;
}

export async function updateTank(id: string, data: UpdateTankPayload): Promise<TankDetail> {
  const res = await api.patch<ResponseSuccess<TankDetail>>(`/tanks/${id}`, data);
  return res.data.data!;
}

export async function deleteTank(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/tanks/${id}`);
  return res.data;
}
