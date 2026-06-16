// src/features/inspection-requests/inspection-requests.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listInspectionRequests,
  getInspectionRequestById,
  createInspectionRequest,
  reviewInspectionRequest,
  cancelInspectionRequest,
} from "./inspection-requests.api";
import type { ListInspectionRequestsParams, CreateInspectionRequestPayload, ReviewInspectionRequestPayload } from "./inspection-requests.api";

export const INSPECTION_REQUEST_KEYS = {
  all: ["inspection-requests"] as const,
  list: (params: ListInspectionRequestsParams) => ["inspection-requests", "list", params] as const,
  detail: (id: string) => ["inspection-requests", "detail", id] as const,
};

export function useInspectionRequests(params: ListInspectionRequestsParams) {
  return useQuery({
    queryKey: INSPECTION_REQUEST_KEYS.list(params),
    queryFn: () => listInspectionRequests(params),
    staleTime: 1000 * 30,
  });
}

export function useInspectionRequest(id: string) {
  return useQuery({
    queryKey: INSPECTION_REQUEST_KEYS.detail(id),
    queryFn: () => getInspectionRequestById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateInspectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInspectionRequestPayload) => createInspectionRequest(data),
    onSuccess: () => {
      toast.success("Inspection request submitted");
      queryClient.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tank-processes"] });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useReviewInspectionRequest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewInspectionRequestPayload) => reviewInspectionRequest(id, data),
    onSuccess: (_, data) => {
      toast.success(data.action === "REVIEWED" ? "Marked as reviewed" : "Request returned");
      queryClient.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tank-processes"] });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useCancelInspectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelInspectionRequest(id),
    onSuccess: () => {
      toast.success("Inspection request cancelled");
      queryClient.invalidateQueries({ queryKey: INSPECTION_REQUEST_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
