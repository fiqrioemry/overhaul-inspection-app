// features/auth/auth.endpoints.ts
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
  revokeSessions: "/auth/sessions-revoke",
  resendVerification: "/auth/resend-verification",
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
