// src/constants/auth.constant.ts
export const AUTH_ENDPOINTS = {
  me: "/auth/me",
  login: "/auth/login",
  logout: "/auth/logout",
  register: "/auth/register",
  sessions: "/auth/sessions",
  verifyEmail: "/auth/verify-email",
  resetPassword: "/auth/reset-password",
  forgotPassword: "/auth/forgot-password",
  changePassword: "/auth/change-password",
  setPassword: "/auth/set-password",
  revokeSessions: "/auth/sessions-revoke",
  resendVerification: "/auth/resend-verification",
  twoFactorSetup: "/auth/2fa/setup",
  twoFactorVerify: "/auth/2fa/verify",
  twoFactorDisable: "/auth/2fa/disable",
  twoFactorChallenge: "/auth/2fa/challenge",
} as const;

export const OAUTH_ENDPOINTS = {
  google: "/auth/google",
  github: "/auth/github",
} as const;

export type OAuthProviderKey = keyof typeof OAUTH_ENDPOINTS;

export const OAUTH_PROVIDER_CONFIG = {
  google: {
    label: "Google",
    icon: "google", // dipakai di komponen
  },
  github: {
    label: "GitHub",
    icon: "github",
  },
} satisfies Record<OAuthProviderKey, { label: string; icon: string }>;
