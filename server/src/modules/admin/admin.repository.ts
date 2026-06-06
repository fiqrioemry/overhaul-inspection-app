import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/lib/database";
import { GetAdminUsersQuery, GetReportsQuery } from "@/modules/admin/admin.schema";

export class AdminRepository {
  static async getReports(query: GetReportsQuery) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: Prisma.PostReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.reason ? { reason: query.reason as any } : {}),
    };

    const [reports, totalItems] = await Promise.all([
      database.postReport.findMany({
        where,
        select: {
          id: true,
          reason: true,
          description: true,
          status: true,
          actionTaken: true,
          createdAt: true,
          reviewedAt: true,
          post: { select: { id: true, title: true, userId: true } },
          user: { select: { id: true, username: true, avatar: true } },
          reviewedBy: { select: { id: true, username: true } },
        } as any,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.postReport.count({ where }),
    ]);

    return { reports, totalItems, page, limit };
  }

  static async findReportById(id: string) {
    return database.postReport.findUnique({ where: { id }, select: { id: true, status: true } });
  }

  static async updateReport(tx: Prisma.TransactionClient, id: string, data: { status: string; actionTaken?: string; reviewedBy: string; reviewedAt: Date }) {
    return tx.postReport.update({ where: { id }, data });
  }

  static async getUsers(query: GetAdminUsersQuery) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { username: { contains: query.search, mode: "insensitive" } },
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, totalItems] = await Promise.all([
      database.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          isPublic: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLogin: true,
          _count: { select: { posts: { where: { deletedAt: null } }, followers: { where: { status: "ACCEPTED" } }, following: { where: { status: "ACCEPTED" } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.user.count({ where }),
    ]);

    return { users, totalItems, page, limit };
  }

  static async updateUserStatus(tx: Prisma.TransactionClient, userId: string, status: string) {
    return tx.user.update({ where: { id: userId }, data: { status: status as any }, select: { id: true, status: true, updatedAt: true } });
  }

  static async getStats() {
    const [totalUsers, activeUsers, bannedUsers, totalPosts, totalReports, pendingReports, totalChats] = await Promise.all([
      database.user.count({ where: { deletedAt: null } }),
      database.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
      database.user.count({ where: { status: "BANNED" } }),
      database.post.count({ where: { deletedAt: null } }),
      database.postReport.count(),
      database.postReport.count({ where: { status: "PENDING" } }),
      database.chat.count({ where: { deletedAt: null } }),
    ]);

    return { totalUsers, activeUsers, bannedUsers, totalPosts, totalReports, pendingReports, totalChats };
  }
}
