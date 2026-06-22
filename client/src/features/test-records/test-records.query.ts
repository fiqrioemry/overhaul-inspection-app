// src/features/test-records/test-records.query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listTestRecordsByRequest,
  listTestRecordsByProcess,
  createTestRecord,
  updateTestRecord,
  deleteTestRecord,
} from "./test-records.api";
import type { CreateTestRecordPayload, UpdateTestRecordPayload } from "./test-records.api";
import { INSPECTION_REQUEST_KEYS } from "@/features/inspection-requests/inspection-requests.query";

export const TEST_RECORD_KEYS = {
  all: ["test-records"] as const,
  byRequest: (inspectionRequestId: string) => ["test-records", "by-request", inspectionRequestId] as const,
  byProcess: (tankProcessId: string) => ["test-records", "by-process", tankProcessId] as const,
  detail: (id: string) => ["test-records", "detail", id] as const,
};

export function useTestRecordsByRequest(inspectionRequestId: string) {
  return useQuery({
    queryKey: TEST_RECORD_KEYS.byRequest(inspectionRequestId),
    queryFn: () => listTestRecordsByRequest(inspectionRequestId),
    enabled: Boolean(inspectionRequestId),
  });
}

export function useTestRecordsByProcess(tankProcessId: string) {
  return useQuery({
    queryKey: TEST_RECORD_KEYS.byProcess(tankProcessId),
    queryFn: () => listTestRecordsByProcess(tankProcessId),
    enabled: Boolean(tankProcessId),
  });
}

export function useCreateTestRecord(inspectionRequestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestRecordPayload) => createTestRecord(inspectionRequestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byRequest(inspectionRequestId) });
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(inspectionRequestId) });
      toast.success("Test record created successfully");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to create test record"),
  });
}

export function useUpdateTestRecord(inspectionRequestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRecordPayload }) => updateTestRecord(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byRequest(inspectionRequestId) });
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(inspectionRequestId) });
      toast.success("Test record updated successfully");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to update test record"),
  });
}

export function useDeleteTestRecord(inspectionRequestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTestRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byRequest(inspectionRequestId) });
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(inspectionRequestId) });
      toast.success("Test record deleted");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to delete test record"),
  });
}
