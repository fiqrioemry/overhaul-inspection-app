export const ADMIN_ENDPOINTS = {
  reports: "/admin/reports",
  report: (reportId: string) => `/admin/reports/${reportId}`,
  users: "/admin/users",
  userStatus: (userId: string) => `/admin/users/${userId}/status`,
  stats: "/admin/stats",
} as const;
