import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum } from "generated/prisma";
import { DailyReportRepository } from "./daily-report.repository";
import { DailyReportAttachmentRepository } from "./daily-report-attachment.repository";
import { FileService } from "@/modules/files/file.service";
import { sanitizeHtml } from "@/utils/sanitize-html";
import type { CreateDailyReportRequest, UpdateDailyReportRequest, ListDailyReportsQuery } from "./daily-report.schema";
import type { DailyReportListItem, DailyReportListResult } from "./daily-report.types";

const MAX_ATTACHMENTS = 15;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DAILY_REPORT_BLOCKED_STATUSES: ProcessStatusEnum[] = [ProcessStatusEnum.NOT_STARTED, ProcessStatusEnum.COMPLETED];

function validateFiles(files: File[]) {
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new HTTPException(400, {
        message: `File "${file.name}" has unsupported type ${file.type}. Allowed: jpeg, png, webp.`,
        cause: "INVALID_FILE_TYPE",
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new HTTPException(400, {
        message: `File "${file.name}" exceeds the 8 MB size limit.`,
        cause: "FILE_TOO_LARGE",
      });
    }
  }
}

export class DailyReportService {
  static async createReport(c: Context, data: CreateDailyReportRequest, files: File[], userId: string) {
    // A daily report can be: routine monitoring (tank only), a project report
    // (tank + project), a process report (tank + project + process), or a general
    // record with no tank/project at all. project/tank are derived from the process
    // when one is supplied so the three columns stay consistent.
    let tankId = data.tankId ?? null;
    let projectId = data.projectId ?? null;
    const tankProcessId = data.tankProcessId ?? null;

    if (tankProcessId) {
      const tankProcess = await pgsql.tankProcess.findUnique({
        where: { id: tankProcessId },
        include: { project: { select: { id: true, tankId: true } } },
      });
      if (!tankProcess) throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });

      // derive project + tank from the process; validate against any provided values
      if (projectId && projectId !== tankProcess.projectId) {
        throw new HTTPException(422, { message: "Tank process does not belong to the provided project", cause: "PROCESS_PROJECT_MISMATCH" });
      }
      if (tankId && tankId !== tankProcess.project.tankId) {
        throw new HTTPException(422, { message: "Tank process does not belong to the provided tank", cause: "PROCESS_TANK_MISMATCH" });
      }
      projectId = tankProcess.projectId;
      tankId = tankProcess.project.tankId;

      if (DAILY_REPORT_BLOCKED_STATUSES.includes(tankProcess.status as ProcessStatusEnum)) {
        throw new HTTPException(422, {
          message: `Cannot add daily report when process is ${tankProcess.status}`,
          cause: "INVALID_PROCESS_STATUS_FOR_DAILY_REPORT",
        });
      }
    } else if (projectId) {
      const project = await pgsql.tankProject.findFirst({ where: { id: projectId, deletedAt: null }, select: { tankId: true } });
      if (!project) throw new HTTPException(404, { message: "Tank project not found", cause: "PROJECT_NOT_FOUND" });
      if (tankId && tankId !== project.tankId) {
        throw new HTTPException(422, { message: "Project does not belong to the provided tank", cause: "PROJECT_TANK_MISMATCH" });
      }
      tankId = project.tankId;
    } else if (tankId) {
      const tank = await pgsql.tank.findFirst({ where: { id: tankId, deletedAt: null } });
      if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    if (files.length > MAX_ATTACHMENTS) {
      throw new HTTPException(400, {
        message: `Maximum ${MAX_ATTACHMENTS} image attachments are allowed per daily report`,
        cause: "DAILY_REPORT_ATTACHMENT_LIMIT_EXCEEDED",
      });
    }
    validateFiles(files);

    // Process + upload to MinIO outside transaction
    const fileRecords = files.length > 0
      ? await Promise.all(files.map((f) => FileService.generateFileRecord(f, "DAILY_REPORT")))
      : [];
    if (fileRecords.length > 0) {
      await Promise.all(fileRecords.map((fr) => FileService.uploadFileToStorage(c, fr)));
    }

    const report = await pgsql.$transaction(async (tx) => {
      const created = await tx.dailyReport.create({
        data: {
          tankId,
          projectId,
          tankProcessId,
          reportDate: new Date(data.reportDate),
          activityType: data.activityType,
          description: sanitizeHtml(data.description) ?? data.description,
          recommendation: sanitizeHtml(data.recommendation),
          inspectorId: data.inspectorId ?? userId,
          pertaminaPicId: data.pertaminaPicId ?? null,
        },
      });

      if (fileRecords.length > 0) {
        const storedFiles = await Promise.all(
          fileRecords.map((fr) =>
            tx.fileStorage.create({
              data: {
                url: fr.url!,
                isUsed: true,
                path: fr.path!,
                meta: fr.metadata!,
                module: "DAILY_REPORT",
                size: fr.size!,
                createdBy: userId,
                mimeType: fr.mimeType ?? null,
              },
              select: { id: true, url: true },
            }),
          ),
        );

        await DailyReportAttachmentRepository.createMany(
          tx,
          storedFiles.map((f, idx) => ({
            dailyReportId: created.id,
            fileStorageId: f.id,
            attachmentUrl: f.url,
            sortOrder: idx,
            caption: data.newFileCaptions?.[idx] ?? undefined,
          })),
        );
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
      projectId: r.projectId,
      tankProcessId: r.tankProcessId,
      reportDate: r.reportDate,
      activityType: r.activityType,
      description: r.description,
      recommendation: (r as any).recommendation ?? null,
      inspectorId: r.inspectorId,
      pertaminaPicId: r.pertaminaPicId,
      aiSuggestedDescription: (r as any).aiSuggestedDescription ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tank: r.tank,
      project: r.project
        ? {
            id: r.project.id,
            projectNo: r.project.projectNo,
            type: r.project.type,
            status: r.project.status,
            inspectionCompany: r.project.inspectionCompany ?? null,
            contractorCompany: r.project.contractorCompany ?? null,
          }
        : null,
      tankProcess: r.tankProcess ?? null,
      inspector: r.inspector ?? null,
      attachments: (r as any).attachments ?? [],
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
    if (!report) throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });
    return report;
  }

  static async updateReport(c: Context, id: string, data: UpdateDailyReportRequest, newFiles: File[], userId: string) {
    const report = await DailyReportRepository.findById(id);
    if (!report) throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });

    const activeAttachments = await DailyReportAttachmentRepository.findActiveByDailyReportId(id);
    const removedIds = data.removedAttachmentIds ?? [];
    const captions = data.captions ?? [];
    const sortOrders = data.sortOrders ?? [];

    const countAfterRemoval = activeAttachments.length - removedIds.filter((rid) => activeAttachments.some((a) => a.id === rid)).length;
    const newTotal = countAfterRemoval + newFiles.length;

    if (newTotal > MAX_ATTACHMENTS) {
      throw new HTTPException(400, {
        message: `Maximum ${MAX_ATTACHMENTS} image attachments are allowed per daily report`,
        cause: "DAILY_REPORT_ATTACHMENT_LIMIT_EXCEEDED",
      });
    }
    validateFiles(newFiles);

    // Get fileStorageIds for files being removed
    const removedAttachments = removedIds.length > 0
      ? await DailyReportAttachmentRepository.findActiveByIds(removedIds, id)
      : [];
    const removedFileStorageIds = removedAttachments.map((a) => a.fileStorageId);

    // Process + upload new files outside transaction
    const fileRecords = newFiles.length > 0
      ? await Promise.all(newFiles.map((f) => FileService.generateFileRecord(f, "DAILY_REPORT")))
      : [];
    if (fileRecords.length > 0) {
      await Promise.all(fileRecords.map((fr) => FileService.uploadFileToStorage(c, fr)));
    }

    await pgsql.$transaction(async (tx) => {
      // Soft-delete removed attachments + mark files as unused
      if (removedIds.length > 0) {
        await DailyReportAttachmentRepository.softDeleteByIds(tx, removedIds, id);
        if (removedFileStorageIds.length > 0) {
          await tx.fileStorage.updateMany({
            where: { id: { in: removedFileStorageIds } },
            data: { isUsed: false },
          });
        }
      }

      // Create new FileStorage + DailyReportAttachment records
      if (fileRecords.length > 0) {
        const nextSortOrder = countAfterRemoval;
        const storedFiles = await Promise.all(
          fileRecords.map((fr) =>
            tx.fileStorage.create({
              data: {
                url: fr.url!,
                isUsed: true,
                path: fr.path!,
                meta: fr.metadata!,
                module: "DAILY_REPORT",
                size: fr.size!,
                createdBy: userId,
                mimeType: fr.mimeType ?? null,
              },
              select: { id: true, url: true },
            }),
          ),
        );

        await DailyReportAttachmentRepository.createMany(
          tx,
          storedFiles.map((f, idx) => ({
            dailyReportId: id,
            fileStorageId: f.id,
            attachmentUrl: f.url,
            sortOrder: nextSortOrder + idx,
          })),
        );
      }

      // Update captions for existing attachments
      if (captions.length > 0) {
        await DailyReportAttachmentRepository.updateCaptions(tx, captions, id);
      }

      // Update sort orders for drag-reordered attachments
      if (sortOrders.length > 0) {
        await DailyReportAttachmentRepository.updateSortOrders(tx, sortOrders, id);
      }

      // Update DailyReport fields
      await tx.dailyReport.update({
        where: { id },
        data: {
          ...(data.reportDate && { reportDate: new Date(data.reportDate) }),
          ...(data.activityType && { activityType: data.activityType }),
          ...(data.description !== undefined && { description: sanitizeHtml(data.description) ?? data.description }),
          ...(data.recommendation !== undefined && { recommendation: sanitizeHtml(data.recommendation) }),
          ...(data.inspectorId !== undefined && { inspectorId: data.inspectorId }),
          ...(data.pertaminaPicId !== undefined && { pertaminaPicId: data.pertaminaPicId }),
        },
      });
    });

    return DailyReportRepository.findById(id);
  }

  static async deleteReport(id: string) {
    const report = await DailyReportRepository.findById(id);
    if (!report) throw new HTTPException(404, { message: "Daily report not found", cause: "REPORT_NOT_FOUND" });
    await DailyReportRepository.softDelete(id);
  }

  static async listTankOptions() {
    return DailyReportRepository.findTankOptions();
  }

  static async listTankProcessOptions(tankId: string) {
    const tank = await pgsql.tank.findFirst({ where: { id: tankId, deletedAt: null }, select: { id: true } });
    if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    return DailyReportRepository.findTankProcessOptions(tankId);
  }

  static async listProjectOptions(tankId: string) {
    const tank = await pgsql.tank.findFirst({ where: { id: tankId, deletedAt: null }, select: { id: true } });
    if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    return DailyReportRepository.findProjectOptions(tankId);
  }
}
