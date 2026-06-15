// src/features/auth/auth.api.ts
import api from "@/lib/axios";
import { AUTH_ENDPOINTS, OAUTH_ENDPOINTS, type OAuthProviderKey } from "@/constants/auth.constant";
import type { MeResponse } from "@/types/users.type";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { ForgotPasswordFormValues, LoginFormValues, ResetPasswordFormValues } from "@/schemas/auth.schema";

export async function login(data: LoginFormValues): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.login, data);
  return res.data;
}

export async function logout(): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.logout);
  return res.data;
}

export async function forgotPassword(data: ForgotPasswordFormValues): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.forgotPassword, data);
  return res.data;
}

export async function resetPassword(token: string, data: ResetPasswordFormValues): Promise<ResponseOK> {
  const res = await api.post(`${AUTH_ENDPOINTS.resetPassword}?token=${token}`, data);
  return res.data;
}

export async function verifyEmail(token: string): Promise<ResponseOK> {
  const res = await api.post(`${AUTH_ENDPOINTS.verifyEmail}?token=${token}`);
  return res.data;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await api.get<ResponseSuccess<MeResponse>>(AUTH_ENDPOINTS.me);
  return res.data.data!;
}

export function redirectToOAuth(provider: OAuthProviderKey): void {
  const baseURL = import.meta.env.VITE_API_URL as string;
  window.location.href = `${baseURL}${OAUTH_ENDPOINTS[provider]}`;
}
