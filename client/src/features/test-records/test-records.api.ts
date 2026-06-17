// src/features/test-records/test-records.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type TestResult = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";

export interface TestRecord {
  id: string;
  tankProcessId: string;
  testDate: string | null;
  testPressure: number | null;
  pressureUnit: string | null;
  holdingTime: string | null;
  testMedium: string | null;
  leakIndication: boolean | null;
  result: TestResult;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser: { id: string; name: string } | null;
}

export interface CreateTestRecordPayload {
  testDate?: string;
  testPressure?: number;
  pressureUnit?: string;
  holdingTime?: string;
  testMedium?: string;
  leakIndication?: boolean;
  result?: TestResult;
  remarks?: string;
  fileIds?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateTestRecordPayload extends CreateTestRecordPayload {}

export interface CompleteTestRecordPayload {
  result: "PASSED" | "FAILED";
  remarks?: string;
  actualFinishDate?: string;
}

export async function listTestRecords(tankProcessId: string): Promise<TestRecord[]> {
  const res = await api.get<ResponseSuccess<TestRecord[]>>(`/processes/${tankProcessId}/test-records`);
  return res.data.data!;
}

export async function getTestRecordById(id: string): Promise<TestRecord> {
  const res = await api.get<ResponseSuccess<TestRecord>>(`/test-records/${id}`);
  return res.data.data!;
}

export async function createTestRecord(tankProcessId: string, data: CreateTestRecordPayload): Promise<TestRecord> {
  const res = await api.post<ResponseSuccess<TestRecord>>(`/processes/${tankProcessId}/test-records`, data);
  return res.data.data!;
}

export async function updateTestRecord(id: string, data: UpdateTestRecordPayload): Promise<TestRecord> {
  const res = await api.patch<ResponseSuccess<TestRecord>>(`/test-records/${id}`, data);
  return res.data.data!;
}

export async function completeTestRecord(id: string, data: CompleteTestRecordPayload): Promise<TestRecord> {
  const res = await api.patch<ResponseSuccess<TestRecord>>(`/test-records/${id}/complete`, data);
  return res.data.data!;
}

export async function deleteTestRecord(id: string): Promise<void> {
  await api.delete(`/test-records/${id}`);
}
