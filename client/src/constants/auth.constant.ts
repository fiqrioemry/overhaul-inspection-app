// src/constants/auth.constant.ts
export const AUTH_ENDPOINTS = {
  getMe: "/auth/me",
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
