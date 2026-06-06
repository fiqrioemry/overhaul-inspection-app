/* eslint-disable react-hooks/exhaustive-deps */
// src/features/auth/auth.query.ts
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { ResetPasswordRequest } from "@/schemas/auth.schema";
import type { ChangePasswordFormValues } from "@/schemas/settings.schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, getSessions, deleteSession, logoutAll, changePassword, resetPassword, setup2FA, verify2FA, disable2FA } from "./auth.api";

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

export function useSetup2FA() {
  return useMutation({
    mutationFn: setup2FA,
  });
}

export function useVerify2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => verify2FA(code),
    onSuccess: (res) => {
      toast.success(res.message || "2FA enabled successfully");
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => disable2FA(code),
    onSuccess: (res) => {
      toast.success(res.message || "2FA disabled successfully");
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}
