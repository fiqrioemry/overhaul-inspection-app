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
