import qs from "qs";
import api from "@/lib/axios";
import type { Session } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { AUTH_ENDPOINTS } from "@/constants/auth.constant";
import type { LoginData, UserAccount } from "@/types/users.type";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { ChangePasswordFormValues } from "@/schemas/settings.schema";
import { OAUTH_ENDPOINTS, type OAuthProviderKey } from "@/constants/auth.constant";
import type { ForgotPasswordFormValues, LoginFormValues, RegisterFormValues } from "@/schemas/auth.schema";

export async function login(data: LoginFormValues): Promise<ResponseSuccess<LoginData>> {
  const res = await api.post(AUTH_ENDPOINTS.login, data);
  return res.data;
}

export async function register(data: RegisterFormValues): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.register, data);
  return res.data;
}

export async function resetPassword(email: string): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.resetPassword, { email });
  return res.data;
}

export async function forgotPassword(data: ForgotPasswordFormValues): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.forgotPassword, data);
  return res.data;
}

export async function resendVerificationEmail(email: string): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.resendVerification, { email });
  return res.data;
}

export async function verifyEmail(token: string): Promise<ResponseOK> {
  const queryString = qs.stringify({ token }, { skipNulls: true });
  const res = await api.post(`${AUTH_ENDPOINTS.verifyEmail}?${queryString}`);
  return res.data;
}

export async function logout(): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.logout);
  return res.data;
}

export async function logoutAll(): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.revokeSessions);
  useAuthStore.getState().clearUser();
  return res.data;
}

export async function deleteSession(sessionId: string): Promise<ResponseOK> {
  const res = await api.delete(`${AUTH_ENDPOINTS.sessions}/${sessionId}`);
  return res.data;
}

export async function getSessions(): Promise<ResponseSuccess<Session>> {
  const res = await api.get(AUTH_ENDPOINTS.sessions);
  return res.data;
}

export async function changePassword(payload: ChangePasswordFormValues): Promise<ResponseOK> {
  const res = await api.patch(AUTH_ENDPOINTS.changePassword, payload);
  return res.data;
}

export async function fetchMe(): Promise<UserAccount> {
  const res = await api.get(AUTH_ENDPOINTS.me);
  return res.data.data;
}

export function redirectToOAuth(provider: OAuthProviderKey): void {
  const baseURL = import.meta.env.VITE_API_URL as string;
  window.location.href = `${baseURL}${OAUTH_ENDPOINTS[provider]}`;
}
