import { HTTPException } from "hono/http-exception";
import { FileRepository } from "@/modules/files/file.repository";
import { pgsql } from "@/lib/database";
import { DailyReportRepository } from "./daily-report.repository";
import { CreateDailyReportRequest, ListDailyReportsQuery, UpdateDailyReportRequest } from "./daily-report.schema";

export class DailyReportService {
  static async createReport(data: CreateDailyReportRequest, userId: string) {
    const tank = await pgsql.tank.findFirst({ where: { id: data.tankId, deletedAt: null } });
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    const report = await pgsql.$transaction(async (tx) => {
      const created = await tx.dailyReport.create({
        data: {
          tankId: data.tankId,
          tankProcessId: data.tankProcessId,
          reportDate: new Date(data.reportDate),
          activityType: data.activityType,
          description: data.description,
          inspectorId: data.inspectorId ?? userId,
          pertaminaPicId: data.pertaminaPicId,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, created.id, "DAILY_REPORT");
      }

      return created;
    });

    return DailyReportRepository.findById(report.id);
  }

  static async listReports(query: ListDailyReportsQuery) {
    const { reports, total } = await DailyReportRepository.findMany(query);
    return {
      data: reports,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
      },
    };
  }

  static async getReportById(id: string) {
    const report = await DailyReportRepository.findById(id);
    if (!report) {
      throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });
    }
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "DAILY_REPORT");
    return { ...report, attachments };
  }

  static async updateReport(id: string, data: UpdateDailyReportRequest) {
    const report = await DailyReportRepository.findById(id);
    if (!report) {
      throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });
    }

    await pgsql.$transaction(async (tx) => {
      await tx.dailyReport.update({
        where: { id },
        data: {
          tankId: data.tankId,
          tankProcessId: data.tankProcessId,
          reportDate: data.reportDate ? new Date(data.reportDate) : undefined,
          activityType: data.activityType,
          description: data.description,
          inspectorId: data.inspectorId,
          pertaminaPicId: data.pertaminaPicId,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, id, "DAILY_REPORT");
      }
    });

    return DailyReportRepository.findById(id);
  }

  static async deleteReport(id: string) {
    const report = await DailyReportRepository.findById(id);
    if (!report) {
      throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });
    }
    await DailyReportRepository.softDelete(id);
  }
}
