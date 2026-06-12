export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export interface AdminReportItem {
  id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  actionTaken: string | null;
  createdAt: string;
  reviewedAt: string | null;
  post: { id: string; title: string; userId: string };
  reporter: { id: string; username: string; avatar: string | null };
  reviewedBy: { id: string; username: string } | null;
}

export interface AdminUserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: "USER" | "ADMIN";
  status: UserStatus;
  isPublic: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLogin: string | null;
  totalPosts: number;
  totalFollowers: number;
  totalFollowings: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingReports: number;
  totalChats: number;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  reason?: string;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: "USER" | "ADMIN";
}

export interface UpdateReportPayload {
  status: "REVIEWED" | "RESOLVED" | "DISMISSED";
  actionTaken?: string;
}

export interface UpdateUserStatusPayload {
  status: UserStatus;
}
