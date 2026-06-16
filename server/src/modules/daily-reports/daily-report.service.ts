import { HTTPException } from "hono/http-exception";
import { FileRepository } from "@/modules/files/file.repository";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum } from "generated/prisma";
import { DailyReportRepository } from "./daily-report.repository";
import { CreateDailyReportRequest, ListDailyReportsQuery, UpdateDailyReportRequest } from "./daily-report.schema";
import type { DailyReportListItem, DailyReportListResult } from "./daily-report.types";

const DAILY_REPORT_BLOCKED_STATUSES: ProcessStatusEnum[] = [ProcessStatusEnum.NOT_STARTED, ProcessStatusEnum.COMPLETED];

export class DailyReportService {
  static async createReport(data: CreateDailyReportRequest, userId: string) {
    const tank = await pgsql.tank.findFirst({ where: { id: data.tankId, deletedAt: null } });
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    if (data.tankProcessId) {
      const tankProcess = await pgsql.tankProcess.findFirst({ where: { id: data.tankProcessId, deletedAt: null } });
      if (!tankProcess) {
        throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
      }
      if (DAILY_REPORT_BLOCKED_STATUSES.includes(tankProcess.status as ProcessStatusEnum)) {
        throw new HTTPException(422, {
          message: `Cannot add daily report when process is ${tankProcess.status}`,
          cause: "INVALID_PROCESS_STATUS_FOR_DAILY_REPORT",
        });
      }
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

  static async listReports(query: ListDailyReportsQuery): Promise<DailyReportListResult> {
    const { reports, total } = await DailyReportRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: DailyReportListItem[] = reports.map((r) => ({
      id: r.id,
      tankId: r.tankId,
      tankProcessId: r.tankProcessId,
      reportDate: r.reportDate,
      activityType: r.activityType,
      description: r.description,
      inspectorId: r.inspectorId,
      pertaminaPicId: r.pertaminaPicId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tank: r.tank,
      tankProcess: r.tankProcess,
      inspector: r.inspector,
    }));

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
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
