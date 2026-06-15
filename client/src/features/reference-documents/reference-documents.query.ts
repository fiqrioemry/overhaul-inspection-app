// src/features/reference-documents/reference-documents.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReferenceDocuments,
  getAllReferenceDocuments,
  createReferenceDocument,
  updateReferenceDocument,
  deleteReferenceDocument,
} from "./reference-documents.api";
import type { ListReferenceDocumentsParams, CreateReferenceDocumentPayload, UpdateReferenceDocumentPayload } from "./reference-documents.api";

export const REFERENCE_DOCUMENT_KEYS = {
  all: ["reference-documents"] as const,
  list: (params: ListReferenceDocumentsParams) => ["reference-documents", "list", params] as const,
  allList: ["reference-documents", "all"] as const,
};

export function useReferenceDocuments(params: ListReferenceDocumentsParams) {
  return useQuery({
    queryKey: REFERENCE_DOCUMENT_KEYS.list(params),
    queryFn: () => listReferenceDocuments(params),
    staleTime: 1000 * 30,
  });
}

export function useAllReferenceDocuments() {
  return useQuery({
    queryKey: REFERENCE_DOCUMENT_KEYS.allList,
    queryFn: () => getAllReferenceDocuments(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateReferenceDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferenceDocumentPayload) => createReferenceDocument(data),
    onSuccess: () => {
      toast.success("Reference document created successfully");
      queryClient.invalidateQueries({ queryKey: REFERENCE_DOCUMENT_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateReferenceDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReferenceDocumentPayload }) => updateReferenceDocument(id, data),
    onSuccess: () => {
      toast.success("Reference document updated successfully");
      queryClient.invalidateQueries({ queryKey: REFERENCE_DOCUMENT_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteReferenceDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReferenceDocument(id),
    onSuccess: (res) => {
      toast.success(res.message || "Reference document deleted successfully");
      queryClient.invalidateQueries({ queryKey: REFERENCE_DOCUMENT_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
