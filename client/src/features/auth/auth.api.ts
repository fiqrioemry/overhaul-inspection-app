// src/features/auth/auth.api.ts
import qs from "qs";
import api from "@/lib/axios";
import type { Session } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { AUTH_ENDPOINTS } from "@/constants/auth.constant";
import type { LoginData, UserAccount, TwoFactorSetupData, TwoFactorVerifyData } from "@/types/users.type";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { ChangePasswordFormValues, SetPasswordFormValues } from "@/schemas/settings.schema";
import { OAUTH_ENDPOINTS, type OAuthProviderKey } from "@/constants/auth.constant";
import type { ForgotPasswordFormValues, LoginFormValues, RegisterFormValues, ResetPasswordRequest, TwoFactorChallengeFormValues } from "@/schemas/auth.schema";

export async function login(data: LoginFormValues): Promise<ResponseSuccess<LoginData>> {
  const res = await api.post(AUTH_ENDPOINTS.login, data);
  return res.data;
}

export async function register(data: RegisterFormValues): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.register, data);
  return res.data;
}

export async function resetPassword(token: string, payload: ResetPasswordRequest): Promise<ResponseOK> {
  const res = await api.post(`${AUTH_ENDPOINTS.resetPassword}?token=${token}`, payload);
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

export async function setPassword(payload: SetPasswordFormValues): Promise<ResponseOK> {
  const res = await api.post(AUTH_ENDPOINTS.setPassword, payload);
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

export async function setup2FA(): Promise<ResponseSuccess<TwoFactorSetupData>> {
  const res = await api.post(AUTH_ENDPOINTS.twoFactorSetup);
  return res.data;
}

export async function verify2FA(code: string): Promise<ResponseSuccess<TwoFactorVerifyData>> {
  const res = await api.post(AUTH_ENDPOINTS.twoFactorVerify, { code });
  return res.data;
}

export async function disable2FA(code: string): Promise<ResponseOK> {
  const res = await api.delete(AUTH_ENDPOINTS.twoFactorDisable, { data: { code } });
  return res.data;
}

export async function challenge2FA(payload: TwoFactorChallengeFormValues & { challengeToken: string }): Promise<ResponseSuccess<LoginData>> {
  const res = await api.post(AUTH_ENDPOINTS.twoFactorChallenge, payload);
  return res.data;
}
