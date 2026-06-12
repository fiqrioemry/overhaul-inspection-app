import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { HTTPException } from "hono/http-exception";
import { AdminRepository } from "@/modules/admin/admin.repository";
import { GetAdminUsersQuery, GetReportsQuery, UpdateReportRequest, UpdateUserStatusRequest } from "@/modules/admin/admin.schema";
import { AdminReportItem, AdminStats, AdminUserItem } from "@/modules/admin/admin.types";
import { adminErrorCode, adminErrorMessage } from "@/config/constant/admin.constant";
import { metaResponse } from "@/modules/users/user.types";

export class AdminService {
  static async getReports(query: GetReportsQuery): Promise<{ data: AdminReportItem[]; meta: metaResponse }> {
    const { reports, totalItems, page, limit } = await AdminRepository.getReports(query);

    const data: AdminReportItem[] = reports.map((r: any) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      actionTaken: r.actionTaken,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      post: r.post,
      reporter: r.user,
      reviewedBy: r.reviewer ?? null,
    }));

    return {
      data,
      meta: {
        pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
        filter: { status: query.status, reason: query.reason },
      },
    };
  }

  static async updateReport(reportId: string, reviewerId: string, payload: UpdateReportRequest) {
    const report = await AdminRepository.findReportById(reportId);
    if (!report) throw new HTTPException(404, { message: adminErrorMessage.REPORT_NOT_FOUND, cause: adminErrorCode.REPORT_NOT_FOUND });

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      return AdminRepository.updateReport(tx, reportId, {
        status: payload.status,
        actionTaken: payload.actionTaken,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      });
    });
  }

  static async getUsers(query: GetAdminUsersQuery): Promise<{ data: AdminUserItem[]; meta: metaResponse }> {
    const { users, totalItems, page, limit } = await AdminRepository.getUsers(query);

    const data: AdminUserItem[] = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      status: u.status,
      isPublic: u.isPublic,
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      totalPosts: u._count.posts,
      totalFollowers: u._count.followers,
      totalFollowings: u._count.following,
    }));

    return {
      data,
      meta: {
        pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
        filter: { search: query.search },
      },
    };
  }

  static async updateUserStatus(adminId: string, targetUserId: string, payload: UpdateUserStatusRequest) {
    if (adminId === targetUserId) throw new HTTPException(400, { message: adminErrorMessage.CANNOT_CHANGE_OWN_STATUS, cause: adminErrorCode.CANNOT_CHANGE_OWN_STATUS });

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      return AdminRepository.updateUserStatus(tx, targetUserId, payload.status);
    });
  }

  static async getStats(): Promise<AdminStats> {
    return AdminRepository.getStats();
  }
}
