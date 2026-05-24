/* eslint-disable react-hooks/exhaustive-deps */
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { ResetPasswordRequest } from "@/schemas/auth.schema";
import type { ChangePasswordFormValues } from "@/schemas/settings.schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, getSessions, deleteSession, logoutAll, changePassword, resetPassword } from "./auth.api";

export const AUTH_KEYS = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const query = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) setUser(query.data);
    if (query.isError) clearUser();
  }, [query.isSuccess, query.isError, query.data]);

  return query;
}

export function useSessions() {
  return useQuery({
    queryKey: AUTH_KEYS.sessions,
    queryFn: getSessions,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.sessions });
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAll,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordFormValues) => changePassword(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Password changed successfully");
    },
  });
}

export function useResetPassword(token: string) {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => resetPassword(token, payload),
    onError: (err) => {
      toast.error(err.message || "Gagal mereset password, coba lagi.");
    },
  });
}
