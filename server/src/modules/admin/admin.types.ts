export type AdminReportItem = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  actionTaken: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  post: { id: string; title: string; userId: string };
  reporter: { id: string; username: string; avatar: string | null };
  reviewedBy: { id: string; username: string } | null;
};

export type AdminUserItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  isPublic: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastLogin: Date | null;
  totalPosts: number;
  totalFollowers: number;
  totalFollowings: number;
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingReports: number;
  totalChats: number;
};
