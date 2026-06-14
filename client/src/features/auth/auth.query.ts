/* eslint-disable react-hooks/exhaustive-deps */
// src/features/auth/auth.query.ts
import { toast } from "sonner";
import i18n from "@/i18n";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, logout, forgotPassword, resetPassword, verifyEmail } from "./auth.api";
import type { ForgotPasswordFormValues, ResetPasswordFormValues } from "@/schemas/auth.schema";

export const AUTH_KEYS = {
  me: ["auth", "me"] as const,
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
