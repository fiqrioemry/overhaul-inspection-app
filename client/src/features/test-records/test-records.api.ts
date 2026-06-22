// src/features/test-records/test-records.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type TestResultStatus = "NOT_STARTED" | "REPAIR" | "PASSED";
export type TestResult = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";

export interface TestRecordAttachment {
  id: string;
  fileStorageId: string;
  attachmentUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface TestRecord {
  id: string;
  inspectionRequestId: string;
  inspectionRequestItemId: string | null;
  tankProcessId: string | null;
  testDate: string | null;
  testPressure: number | null;
  pressureUnit: string | null;
  holdingTime: string | null;
  testMedium: string | null;
  leakIndication: boolean | null;
  status: TestResultStatus;
  result: TestResult;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  inspectionRequest: { id: string; requestNo: string; testType: string; status: string } | null;
  inspectionRequestItem: { id: string; objectType: string; objectName: string | null } | null;
  tankProcess: { id: string; name: string; tank: { id: string; tankNo: string } } | null;
  createdByUser: { id: string; name: string } | null;
  attachments: TestRecordAttachment[];
}

export interface CreateTestRecordPayload {
  inspectionRequestItemId?: string;
  testDate?: string;
  testPressure?: number;
  pressureUnit?: string;
  holdingTime?: string;
  testMedium?: string;
  leakIndication?: boolean;
  status: TestResultStatus;
  remarks?: string;
  files?: File[];
  newFileCaptions?: string[];
}

export interface UpdateTestRecordPayload {
  inspectionRequestItemId?: string | null;
  testDate?: string;
  testPressure?: number;
  pressureUnit?: string;
  holdingTime?: string;
  testMedium?: string;
  leakIndication?: boolean;
  status?: TestResultStatus;
  remarks?: string;
  files?: File[];
  removedAttachmentIds?: string[];
  newFileCaptions?: string[];
}

function toFormData(payload: CreateTestRecordPayload | UpdateTestRecordPayload): FormData {
  const fd = new FormData();
  const p = payload as Record<string, unknown>;
  const scalarKeys = ["inspectionRequestItemId", "testDate", "pressureUnit", "holdingTime", "testMedium", "status", "remarks"];
  for (const key of scalarKeys) {
    const v = p[key];
    if (v !== undefined && v !== null && v !== "") fd.append(key, String(v));
  }
  if (p.testPressure !== undefined && p.testPressure !== null) fd.append("testPressure", String(p.testPressure));
  if (p.leakIndication !== undefined && p.leakIndication !== null) fd.append("leakIndication", String(p.leakIndication));
  (payload.files ?? []).forEach((file) => fd.append("attachments", file));
  if ((payload as UpdateTestRecordPayload).removedAttachmentIds) {
    fd.append("removedAttachmentIds", JSON.stringify((payload as UpdateTestRecordPayload).removedAttachmentIds));
  }
  if (payload.newFileCaptions && payload.newFileCaptions.length > 0) {
    fd.append("newFileCaptions", JSON.stringify(payload.newFileCaptions));
  }
  return fd;
}

export async function listTestRecordsByRequest(inspectionRequestId: string): Promise<TestRecord[]> {
  const res = await api.get<ResponseSuccess<TestRecord[]>>(`/inspection-requests/${inspectionRequestId}/test-records`);
  return res.data.data!;
}

export async function listTestRecordsByProcess(tankProcessId: string): Promise<TestRecord[]> {
  const res = await api.get<ResponseSuccess<TestRecord[]>>(`/processes/${tankProcessId}/test-records`);
  return res.data.data!;
}

export async function getTestRecordById(id: string): Promise<TestRecord> {
  const res = await api.get<ResponseSuccess<TestRecord>>(`/test-records/${id}`);
  return res.data.data!;
}

export async function createTestRecord(inspectionRequestId: string, data: CreateTestRecordPayload): Promise<TestRecord> {
  const res = await api.post<ResponseSuccess<TestRecord>>(`/inspection-requests/${inspectionRequestId}/test-records`, toFormData(data));
  return res.data.data!;
}

export async function updateTestRecord(id: string, data: UpdateTestRecordPayload): Promise<TestRecord> {
  const res = await api.patch<ResponseSuccess<TestRecord>>(`/test-records/${id}`, toFormData(data));
  return res.data.data!;
}

export async function deleteTestRecord(id: string): Promise<void> {
  await api.delete(`/test-records/${id}`);
}
