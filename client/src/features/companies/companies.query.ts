// src/features/companies/companies.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCompanies, createCompany, updateCompany, deleteCompany } from "./companies.api";
import type { ListCompaniesParams, CreateCompanyPayload, UpdateCompanyPayload } from "./companies.api";

export const COMPANY_KEYS = {
  all: ["companies"] as const,
  list: (params: ListCompaniesParams) => ["companies", "list", params] as const,
};

export function useCompanies(params: ListCompaniesParams) {
  return useQuery({
    queryKey: COMPANY_KEYS.list(params),
    queryFn: () => listCompanies(params),
    staleTime: 1000 * 30,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyPayload) => createCompany(data),
    onSuccess: (_, __, _ctx) => {
      toast.success("Company created successfully");
      queryClient.invalidateQueries({ queryKey: COMPANY_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyPayload }) => updateCompany(id, data),
    onSuccess: () => {
      toast.success("Company updated successfully");
      queryClient.invalidateQueries({ queryKey: COMPANY_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: (res) => {
      toast.success(res.message || "Company deleted successfully");
      queryClient.invalidateQueries({ queryKey: COMPANY_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
