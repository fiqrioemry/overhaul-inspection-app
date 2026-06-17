// src/constants/auth.constant.ts
export const AUTH_ENDPOINTS = {
  login: "/auth/login",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
  me: "/auth/me",
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  changePassword: "/auth/change-password",
  sessions: "/auth/sessions",
  sessionsRevoke: "/auth/sessions-revoke",
  deleteSession: (id: string) => `/auth/sessions/${id}`,
} as const;

export const USER_ENDPOINTS = {
  updateProfile: "/users/profile",
  updateAvatar: "/users/profile/avatar",
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
