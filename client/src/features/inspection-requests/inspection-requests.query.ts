// src/features/inspection-requests/inspection-requests.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listInspectionRequests,
  getInspectionRequestById,
  createInspectionRequest,
  updateInspectionRequest,
  submitConfirmInspectionRequest,
  updateInspectionRequestStatus,
  uploadInspectionRequestAttachment,
  removeInspectionRequestAttachment,
  deleteInspectionRequest,
  listRequestTankOptions,
  listRequestTankProcessOptions,
} from "./inspection-requests.api";
import type {
  ListInspectionRequestsParams,
  CreateInspectionRequestPayload,
  UpdateInspectionRequestPayload,
  AttachmentType,
} from "./inspection-requests.api";

export const INSPECTION_REQUEST_KEYS = {
  all: ["inspection-requests"] as const,
  list: (params: ListInspectionRequestsParams) => ["inspection-requests", "list", params] as const,
  detail: (id: string) => ["inspection-requests", "detail", id] as const,
  tankOptions: () => ["inspection-requests", "tank-options"] as const,
  tankProcessOptions: (tankId: string) => ["inspection-requests", "tank-process-options", tankId] as const,
};

export function useInspectionRequests(params: ListInspectionRequestsParams) {
  return useQuery({
    queryKey: INSPECTION_REQUEST_KEYS.list(params),
    queryFn: () => listInspectionRequests(params),
  });
}

export function useInspectionRequest(id: string) {
  return useQuery({
    queryKey: INSPECTION_REQUEST_KEYS.detail(id),
    queryFn: () => getInspectionRequestById(id),
    enabled: Boolean(id),
  });
}

export function useRequestTankOptions() {
  return useQuery({
    queryKey: INSPECTION_REQUEST_KEYS.tankOptions(),
    queryFn: () => listRequestTankOptions(),
  });
}

export function useRequestTankProcessOptions(tankId: string) {
  return useQuery({
    queryKey: INSPECTION_REQUEST_KEYS.tankProcessOptions(tankId),
    queryFn: () => listRequestTankProcessOptions(tankId),
    enabled: Boolean(tankId),
  });
}

export function useCreateInspectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInspectionRequestPayload) => createInspectionRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      toast.success("Inspection request created successfully");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to create inspection request"),
  });
}

export function useUpdateInspectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInspectionRequestPayload }) => updateInspectionRequest(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(id) });
      toast.success("Inspection request updated successfully");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to update inspection request"),
  });
}

export function useSubmitConfirmInspectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitConfirmInspectionRequest(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(id) });
      toast.success("Request submitted and confirmed");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to submit request"),
  });
}

export function useUpdateInspectionRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: "REPAIR" | "PASSED"; remarks?: string }) =>
      updateInspectionRequestStatus(id, status, remarks),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(id) });
      toast.success("Request status updated");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to update status"),
  });
}

export function useUploadInspectionRequestAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attachmentType, files, caption }: { id: string; attachmentType: AttachmentType; files: File[]; caption?: string }) =>
      uploadInspectionRequestAttachment(id, attachmentType, files, caption),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(id) });
      toast.success("Attachment uploaded");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to upload attachment"),
  });
}

export function useRemoveInspectionRequestAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) => removeInspectionRequestAttachment(id, attachmentId),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.detail(id) });
      toast.success("Attachment removed");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to remove attachment"),
  });
}

export function useDeleteInspectionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInspectionRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      toast.success("Inspection request deleted");
    },
    onError: (err: { message: string }) => toast.error(err.message || "Failed to delete inspection request"),
  });
}
