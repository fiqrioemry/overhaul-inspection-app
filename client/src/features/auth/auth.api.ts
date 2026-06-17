// src/features/auth/auth.api.ts
import api from "@/lib/axios";
import { AUTH_ENDPOINTS, OAUTH_ENDPOINTS, USER_ENDPOINTS, type OAuthProviderKey } from "@/constants/auth.constant";
import type { AuthUser, MeResponse } from "@/types/users.type";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { ForgotPasswordFormValues, LoginFormValues, ResetPasswordFormValues } from "@/schemas/auth.schema";

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
}

export interface UpdateProfilePayload {
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

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

export async function updateProfile(data: UpdateProfilePayload): Promise<AuthUser> {
  const res = await api.put<ResponseSuccess<AuthUser>>(USER_ENDPOINTS.updateProfile, data);
  return res.data.data!;
}

export async function updateAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.patch<ResponseSuccess<AuthUser>>(USER_ENDPOINTS.updateAvatar, formData);
  return res.data.data!;
}

export async function changePassword(data: ChangePasswordPayload): Promise<ResponseOK> {
  const res = await api.patch<ResponseOK>(AUTH_ENDPOINTS.changePassword, data);
  return res.data;
}

export async function getSessions(): Promise<Session[]> {
  const res = await api.get<ResponseSuccess<Session[]>>(AUTH_ENDPOINTS.sessions);
  return res.data.data!;
}

export async function deleteSession(sessionId: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(AUTH_ENDPOINTS.deleteSession(sessionId));
  return res.data;
}

export async function revokeAllSessions(): Promise<ResponseOK> {
  const res = await api.post<ResponseOK>(AUTH_ENDPOINTS.sessionsRevoke);
  return res.data;
}
