// src/features/radiography/radiography.query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listRadiographyTests,
  getRadiographyById,
  createRadiography,
  updateRadiography,
  deleteRadiography,
  addJointResult,
  listJointResults,
  updateJointResult,
  deleteJointResult,
} from "./radiography.api";
import type { CreateRadiographyPayload, UpdateRadiographyPayload, AddJointPayload, UpdateJointPayload } from "./radiography.api";

export const RADIOGRAPHY_KEYS = {
  all: ["radiography"] as const,
  byProcess: (tankProcessId: string) => ["radiography", "by-process", tankProcessId] as const,
  detail: (id: string) => ["radiography", "detail", id] as const,
  joints: (radiographyTestId: string) => ["radiography", "joints", radiographyTestId] as const,
};

export function useRadiographyTests(tankProcessId: string) {
  return useQuery({
    queryKey: RADIOGRAPHY_KEYS.byProcess(tankProcessId),
    queryFn: () => listRadiographyTests(tankProcessId),
    enabled: Boolean(tankProcessId),
  });
}

export function useRadiographyTest(id: string) {
  return useQuery({
    queryKey: RADIOGRAPHY_KEYS.detail(id),
    queryFn: () => getRadiographyById(id),
    enabled: Boolean(id),
  });
}

export function useJointResults(radiographyTestId: string) {
  return useQuery({
    queryKey: RADIOGRAPHY_KEYS.joints(radiographyTestId),
    queryFn: () => listJointResults(radiographyTestId),
    enabled: Boolean(radiographyTestId),
  });
}

export function useCreateRadiography(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRadiographyPayload) => createRadiography(tankProcessId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.byProcess(tankProcessId) });
      toast.success("Radiography test created successfully");
    },
    onError: () => {
      toast.error("Failed to create radiography test");
    },
  });
}

export function useUpdateRadiography(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRadiographyPayload }) => updateRadiography(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.byProcess(tankProcessId) });
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.detail(id) });
      toast.success("Radiography test updated");
    },
    onError: () => {
      toast.error("Failed to update radiography test");
    },
  });
}

export function useDeleteRadiography(tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRadiography(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.byProcess(tankProcessId) });
      toast.success("Radiography test deleted");
    },
    onError: () => {
      toast.error("Failed to delete radiography test");
    },
  });
}

export function useAddJointResult(radiographyTestId: string, tankProcessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddJointPayload) => addJointResult(radiographyTestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.joints(radiographyTestId) });
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.byProcess(tankProcessId) });
      toast.success("Joint result added");
    },
    onError: () => {
      toast.error("Failed to add joint result");
    },
  });
}

export function useUpdateJointResult(radiographyTestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJointPayload }) => updateJointResult(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.joints(radiographyTestId) });
      toast.success("Joint result updated");
    },
    onError: () => {
      toast.error("Failed to update joint result");
    },
  });
}

export function useDeleteJointResult(radiographyTestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJointResult(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RADIOGRAPHY_KEYS.joints(radiographyTestId) });
      toast.success("Joint result deleted");
    },
    onError: () => {
      toast.error("Failed to delete joint result");
    },
  });
}
