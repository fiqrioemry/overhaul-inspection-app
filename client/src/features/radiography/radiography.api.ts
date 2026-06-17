/* eslint-disable @typescript-eslint/no-empty-object-type */
// src/features/radiography/radiography.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type RadiographyJointResult = "PENDING" | "ACCEPTED" | "REPAIR" | "RESHOOT";
export type RadiographyResult = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";

export interface JointResult {
  id: string;
  radiographyTestId: string;
  jointNo: string;
  location: string | null;
  weldType: string | null;
  welderNo: string | null;
  filmNo: string | null;
  result: RadiographyJointResult;
  defectType: string | null;
  repairStatus: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface RadiographyTest {
  id: string;
  tankProcessId: string;
  testDate: string | null;
  area: string | null;
  totalJoint: number;
  totalShot: number;
  totalAccepted: number;
  totalRepair: number;
  totalReshoot: number;
  result: RadiographyResult;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser: { id: string; name: string } | null;
  _count?: { jointResults: number };
  jointResults?: JointResult[];
}

export interface CreateRadiographyPayload {
  testDate?: string;
  area?: string;
  remarks?: string;
  fileIds?: string[];
}

export interface UpdateRadiographyPayload extends CreateRadiographyPayload {
  result?: RadiographyResult;
}

export interface AddJointPayload {
  jointNo: string;
  location?: string;
  weldType?: string;
  welderNo?: string;
  filmNo?: string;
  result?: RadiographyJointResult;
  defectType?: string;
  repairStatus?: string;
  remarks?: string;
}

export interface UpdateJointPayload extends Partial<AddJointPayload> {}

export async function listRadiographyTests(tankProcessId: string): Promise<RadiographyTest[]> {
  const res = await api.get<ResponseSuccess<RadiographyTest[]>>(`/processes/${tankProcessId}/radiography-tests`);
  return res.data.data!;
}

export async function getRadiographyById(id: string): Promise<RadiographyTest> {
  const res = await api.get<ResponseSuccess<RadiographyTest>>(`/radiography-tests/${id}`);
  return res.data.data!;
}

export async function createRadiography(tankProcessId: string, data: CreateRadiographyPayload): Promise<RadiographyTest> {
  const res = await api.post<ResponseSuccess<RadiographyTest>>(`/processes/${tankProcessId}/radiography-tests`, data);
  return res.data.data!;
}

export async function updateRadiography(id: string, data: UpdateRadiographyPayload): Promise<RadiographyTest> {
  const res = await api.patch<ResponseSuccess<RadiographyTest>>(`/radiography-tests/${id}`, data);
  return res.data.data!;
}

export async function deleteRadiography(id: string): Promise<void> {
  await api.delete(`/radiography-tests/${id}`);
}

export async function addJointResult(radiographyTestId: string, data: AddJointPayload): Promise<JointResult> {
  const res = await api.post<ResponseSuccess<JointResult>>(`/radiography-tests/${radiographyTestId}/joints`, data);
  return res.data.data!;
}

export async function listJointResults(radiographyTestId: string): Promise<JointResult[]> {
  const res = await api.get<ResponseSuccess<JointResult[]>>(`/radiography-tests/${radiographyTestId}/joints`);
  return res.data.data!;
}

export async function updateJointResult(id: string, data: UpdateJointPayload): Promise<JointResult> {
  const res = await api.patch<ResponseSuccess<JointResult>>(`/radiography-joints/${id}`, data);
  return res.data.data!;
}

export async function deleteJointResult(id: string): Promise<void> {
  await api.delete(`/radiography-joints/${id}`);
}
