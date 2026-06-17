/* eslint-disable react-hooks/exhaustive-deps */
// src/features/auth/auth.query.ts
import { toast } from "sonner";
import i18n from "@/i18n";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMe,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
  updateAvatar,
  changePassword,
  getSessions,
  deleteSession,
  revokeAllSessions,
} from "./auth.api";
import type { ForgotPasswordFormValues, ResetPasswordFormValues } from "@/schemas/auth.schema";
import type { UpdateProfilePayload, ChangePasswordPayload } from "./auth.api";

export const AUTH_KEYS = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
};

export function useMe() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const query = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) setAuth(query.data);
    if (query.isError) clearAuth();
  }, [query.isSuccess, query.isError, query.data]);

  return query;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordFormValues) => forgotPassword(data),
  });
}

export function useResetPassword(token: string) {
  return useMutation({
    mutationFn: (data: ResetPasswordFormValues) => resetPassword(token, data),
    onSuccess: () => {
      toast.success(i18n.t("api:RESET_PASSWORD_SUCCESS"));
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const permissions = useAuthStore((s) => s.permissions);
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateProfile(data),
    onSuccess: (user) => {
      setAuth({ user, permissions });
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      toast.success("Profile updated successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const permissions = useAuthStore((s) => s.permissions);
  return useMutation({
    mutationFn: (file: File) => updateAvatar(file),
    onSuccess: (user) => {
      setAuth({ user, permissions });
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      toast.success("Avatar updated successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) => changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: AUTH_KEYS.sessions,
    queryFn: getSessions,
    staleTime: 1000 * 30,
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      toast.success("Session revoked");
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.sessions });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
