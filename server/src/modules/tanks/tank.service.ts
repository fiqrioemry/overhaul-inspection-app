import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, ChecklistStatusEnum } from "generated/prisma";
import { TankRepository } from "./tank.repository";
import { TankAttachmentRepository } from "./tank-attachment.repository";
import { FileService } from "@/modules/files/file.service";
import { CreateTankRequest, ListTanksQuery, UpdateTankRequest } from "./tank.schema";
import type { TankListItem, TankListResult } from "./tank.types";

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function validateDocumentFiles(files: File[]) {
  if (files.length > MAX_ATTACHMENTS) {
    throw new HTTPException(400, {
      message: `Maximum ${MAX_ATTACHMENTS} document attachments are allowed per tank`,
      cause: "TANK_ATTACHMENT_LIMIT_EXCEEDED",
    });
  }
  for (const file of files) {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
      throw new HTTPException(400, {
        message: `File "${file.name}" has unsupported type ${file.type}. Allowed: pdf, doc, docx, xls, xlsx, jpeg, png, webp.`,
        cause: "INVALID_FILE_TYPE",
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new HTTPException(400, {
        message: `File "${file.name}" exceeds the 15 MB size limit.`,
        cause: "FILE_TOO_LARGE",
      });
    }
  }
}

function isApplicable(applicabilityRule: string | null, hasSteamCoil: boolean): boolean {
  if (!applicabilityRule) return true;
  if (applicabilityRule === "STEAM_COIL") return hasSteamCoil;
  return true;
}

export class TankService {
  static async createTank(data: CreateTankRequest, createdBy: string, c?: Context, files: File[] = []) {
    const existing = await TankRepository.findByTankNo(data.tankNo);
    if (existing) {
      throw new HTTPException(409, { message: "Tank number already exists", cause: "TANK_NO_EXISTS" });
    }

    validateDocumentFiles(files);

    // Process + upload document attachments to MinIO outside the transaction.
    const fileRecords = files.length > 0 && c
      ? await Promise.all(files.map((f) => FileService.generateFileRecord(f, "TANK")))
      : [];
    if (fileRecords.length > 0 && c) {
      await Promise.all(fileRecords.map((fr) => FileService.uploadFileToStorage(c, fr)));
    }

    const templates = await pgsql.processTemplate.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sequenceOrder: "asc" },
      include: { processCriteria: { include: { criteria: true } } },
    });

    const tank = await pgsql.$transaction(async (tx) => {
      const newTank = await tx.tank.create({
        data: {
          tankNo: data.tankNo,
          tankName: data.tankName,
          location: data.location,
          capacityM3: data.capacityM3,
          service: data.service,
          diameterMm: data.diameterMm,
          heightMm: data.heightMm,
          shellCourseCount: data.shellCourseCount,
          bottomPlateDimension: data.bottomPlateDimension,
          hasSteamCoil: data.hasSteamCoil,
          contractorCompanyId: data.contractorCompanyId,
          inspectionCompanyId: data.inspectionCompanyId,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          estimatedFinishDate: data.estimatedFinishDate ? new Date(data.estimatedFinishDate) : undefined,
          createdBy,
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
                module: "TANK",
                size: fr.size!,
                createdBy,
                mimeType: fr.mimeType ?? null,
              },
              select: { id: true, url: true },
            }),
          ),
        );

        await TankAttachmentRepository.createMany(
          tx,
          storedFiles.map((f, idx) => ({
            tankId: newTank.id,
            fileStorageId: f.id,
            attachmentUrl: f.url,
            sortOrder: idx,
            caption: data.newFileCaptions?.[idx] ?? undefined,
          })),
        );
      }

      if (data.shellCourses && data.shellCourses.length > 0) {
        await tx.tankShellCourse.createMany({
          data: data.shellCourses.map((sc) => ({
            tankId: newTank.id,
            courseNo: sc.courseNo,
            thicknessMm: sc.thicknessMm,
            plateDimension: sc.plateDimension,
            remarks: sc.remarks,
          })),
        });
      }

      const applicableTemplates = templates.filter((t) =>
        isApplicable(t.applicabilityRule, data.hasSteamCoil),
      );

      const requiredDepTemplateIds = new Set(
        (await tx.processDependency.findMany({
          where: { isRequired: true },
          select: { processTemplateId: true },
        })).map((d) => d.processTemplateId),
      );

      for (const template of applicableTemplates) {
        const hasRequiredDeps = requiredDepTemplateIds.has(template.id);

        const tankProcess = await tx.tankProcess.create({
          data: {
            tankId: newTank.id,
            processTemplateId: template.id,
            name: template.name,
            type: template.type,
            sequenceOrder: template.sequenceOrder,
            status: hasRequiredDeps ? ProcessStatusEnum.LOCKED : ProcessStatusEnum.NOT_STARTED,
          },
        });

        if (template.processCriteria.length > 0) {
          await tx.checklistResult.createMany({
            data: template.processCriteria.map((pc) => ({
              tankProcessId: tankProcess.id,
              criteriaId: pc.criteriaId,
              status: ChecklistStatusEnum.NOT_CHECKED,
            })),
          });
        }
      }

      return newTank;
    });

    return TankRepository.findById(tank.id);
  }

  static async listTanks(query: ListTanksQuery): Promise<TankListResult> {
    const { tanks, total } = await TankRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: TankListItem[] = tanks.map((t) => ({
      id: t.id,
      tankNo: t.tankNo,
      tankName: t.tankName,
      status: t.status,
      location: t.location,
      capacityM3: t.capacityM3,
      service: t.service,
      diameterMm: t.diameterMm,
      heightMm: t.heightMm,
      shellCourseCount: t.shellCourseCount,
      hasSteamCoil: t.hasSteamCoil,
      startDate: t.startDate,
      estimatedFinishDate: t.estimatedFinishDate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      contractorCompany: t.contractorCompany,
      inspectionCompany: t.inspectionCompany,
      _count: t._count,
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

  static async getTankById(id: string) {
    const tank = await TankRepository.findById(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }
    return tank;
  }

  static async getTankProcesses(id: string) {
    const tank = await TankRepository.findWithProcesses(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }
    return tank.processes;
  }

  static async updateTank(id: string, data: UpdateTankRequest) {
    const tank = await TankRepository.findById(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    if (data.tankNo && data.tankNo !== tank.tankNo) {
      const existing = await TankRepository.findByTankNo(data.tankNo);
      if (existing) {
        throw new HTTPException(409, { message: "Tank number already exists", cause: "TANK_NO_EXISTS" });
      }
    }

    return TankRepository.update(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      estimatedFinishDate: data.estimatedFinishDate ? new Date(data.estimatedFinishDate) : undefined,
    });
  }

  static async deleteTank(id: string) {
    const tank = await TankRepository.findById(id);
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }
    await TankRepository.softDelete(id);
  }
}
