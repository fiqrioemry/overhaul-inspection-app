// src/features/users/users.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser } from "@/features/users/users.api";
import type { ListUsersParams, CreateUserPayload, UpdateUserPayload, UpdateUserStatusPayload } from "@/features/users/users.api";

export const USER_KEYS = {
  all: ["users"] as const,
  list: (params: ListUsersParams) => ["users", "list", params] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => listUsers(params),
    staleTime: 1000 * 30,
  });
}

export function useUserById(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createUser(data),
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) => updateUser(id, data),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserStatusPayload }) => updateUserStatus(id, data),
    onSuccess: (res) => {
      toast.success(res.message || "User status updated");
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (res) => {
      toast.success(res.message || "User deleted successfully");
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
