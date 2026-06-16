// src/features/test-records/test-records.query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listTestRecords,
  createTestRecord,
  updateTestRecord,
  completeTestRecord,
  deleteTestRecord,
} from "./test-records.api";
import type { CreateTestRecordPayload, UpdateTestRecordPayload, CompleteTestRecordPayload } from "./test-records.api";

export const TEST_RECORD_KEYS = {
  all: ["test-records"] as const,
  byProcess: (tankProcessId: string) => ["test-records", "by-process", tankProcessId] as const,
  detail: (id: string) => ["test-records", "detail", id] as const,
};

export function useTestRecords(tankProcessId: string) {
  return useQuery({
    queryKey: TEST_RECORD_KEYS.byProcess(tankProcessId),
    queryFn: () => listTestRecords(tankProcessId),
    enabled: Boolean(tankProcessId),
  });
}

export function useCreateTestRecord(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestRecordPayload) => createTestRecord(tankProcessId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byProcess(tankProcessId) });
      toast.success("Test record created successfully");
    },
    onError: () => {
      toast.error("Failed to create test record");
    },
  });
}

export function useUpdateTestRecord(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRecordPayload }) => updateTestRecord(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byProcess(tankProcessId) });
      toast.success("Test record updated successfully");
    },
    onError: () => {
      toast.error("Failed to update test record");
    },
  });
}

export function useCompleteTestRecord(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteTestRecordPayload }) => completeTestRecord(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byProcess(tankProcessId) });
      qc.invalidateQueries({ queryKey: ["tank-processes"] });
      toast.success("Test record completed");
    },
    onError: () => {
      toast.error("Failed to complete test record");
    },
  });
}

export function useDeleteTestRecord(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTestRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_RECORD_KEYS.byProcess(tankProcessId) });
      toast.success("Test record deleted");
    },
    onError: () => {
      toast.error("Failed to delete test record");
    },
  });
}
