import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum } from "generated/prisma";
import { DailyReportRepository } from "./daily-report.repository";
import { DailyReportAttachmentRepository } from "./daily-report-attachment.repository";
import { FileService } from "@/modules/files/file.service";
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
    const tank = await pgsql.tank.findFirst({ where: { id: data.tankId } });
    if (!tank) throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });

    if (data.tankProcessId) {
      const tankProcess = await pgsql.tankProcess.findUnique({ where: { id: data.tankProcessId } });
      if (!tankProcess) throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
      if (DAILY_REPORT_BLOCKED_STATUSES.includes(tankProcess.status as ProcessStatusEnum)) {
        throw new HTTPException(422, {
          message: `Cannot add daily report when process is ${tankProcess.status}`,
          cause: "INVALID_PROCESS_STATUS_FOR_DAILY_REPORT",
        });
      }
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
          tankId: data.tankId,
          tankProcessId: data.tankProcessId ?? null,
          reportDate: new Date(data.reportDate),
          activityType: data.activityType,
          description: data.description,
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
      tankProcessId: r.tankProcessId,
      reportDate: r.reportDate,
      activityType: r.activityType,
      description: r.description,
      inspectorId: r.inspectorId,
      pertaminaPicId: r.pertaminaPicId,
      aiSuggestedDescription: (r as any).aiSuggestedDescription ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tank: r.tank,
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

      // Update DailyReport fields
      await tx.dailyReport.update({
        where: { id },
        data: {
          ...(data.reportDate && { reportDate: new Date(data.reportDate) }),
          ...(data.activityType && { activityType: data.activityType }),
          ...(data.description !== undefined && { description: data.description }),
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
}
