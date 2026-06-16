import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { FindingStatusEnum, ProcessStatusEnum } from "generated/prisma";
import { FileRepository } from "@/modules/files/file.repository";
import { NotificationService } from "@/modules/notifications/notification.service";
import { FindingRepository } from "./finding.repository";
import { BulkCloseFindingsRequest, CreateFindingRequest, ListFindingsQuery, UpdateFindingRequest, UpdateFindingStatusRequest } from "./finding.schema";
import type { FindingListItem, FindingListResult } from "./finding.types";

function padSeq(n: number): string {
  return String(n + 1).padStart(4, "0");
}

const ALLOWED_STATUS_TRANSITIONS: Partial<Record<FindingStatusEnum, FindingStatusEnum[]>> = {
  [FindingStatusEnum.OPEN]: [FindingStatusEnum.IN_REPAIR, FindingStatusEnum.CLOSE],
  [FindingStatusEnum.IN_REPAIR]: [FindingStatusEnum.OPEN, FindingStatusEnum.CLOSE],
  [FindingStatusEnum.CLOSE]: [],
};

export class FindingService {
  static async createFinding(data: CreateFindingRequest, userId: string) {
    console.log("Creating finding with data:", userId);
    const tank = await pgsql.tank.findFirst({ where: { id: data.tankId, deletedAt: null } });
    if (!tank) {
      throw new HTTPException(404, { message: "Tank not found", cause: "TANK_NOT_FOUND" });
    }

    const tankProcess = await pgsql.tankProcess.findUnique({ where: { id: data.tankProcessId } });
    if (!tankProcess) {
      throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
    }

    const blockedStatuses: ProcessStatusEnum[] = [
      ProcessStatusEnum.NOT_STARTED,
      ProcessStatusEnum.COMPLETED,
      ProcessStatusEnum.REVIEWED,
    ];
    if (blockedStatuses.includes(tankProcess.status as ProcessStatusEnum)) {
      throw new HTTPException(422, {
        message: `Cannot add findings when process is ${tankProcess.status}`,
        cause: "INVALID_PROCESS_STATUS_FOR_FINDING",
      });
    }

    const count = await FindingRepository.countByTankNo(tank.tankNo);
    const findingNo = `FND-${tank.tankNo}-${padSeq(count)}`;

    const finding = await pgsql.$transaction(async (tx) => {
      const created = await tx.finding.create({
        data: {
          tankId: data.tankId,
          tankProcessId: data.tankProcessId,
          criteriaId: data.criteriaId,
          findingNo,
          title: data.title,
          description: data.description,
          locationDetail: data.locationDetail,
          severity: data.severity,
          isBlocking: data.isBlocking,
          createdBy: userId,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, created.id, "FINDING");
      }

      return created;
    });

    const admins = await pgsql.user.findMany({
      where: { role: { in: ["ADMIN", "USER"] }, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await NotificationService.createNotificationForUser({
        userId: admin.id,
        title: "New Finding Created",
        description: `Finding ${findingNo}: "${data.title}" reported on ${tank.tankNo}.`,
        type: "FINDING_CREATED",
        metadata: {
          targetType: "FINDING",
          targetId: finding.id,
          tankId: data.tankId,
          tankNo: tank.tankNo,
        },
      });
    }

    return FindingRepository.findById(finding.id);
  }

  static async listFindings(query: ListFindingsQuery): Promise<FindingListResult> {
    const { findings, total } = await FindingRepository.findMany(query);
    const totalPages = total > 0 ? Math.ceil(total / query.limit) : 0;

    const data: FindingListItem[] = findings.map((f) => ({
      id: f.id,
      findingNo: f.findingNo,
      tankId: f.tankId,
      tankProcessId: f.tankProcessId,
      criteriaId: f.criteriaId,
      title: f.title,
      description: f.description,
      locationDetail: f.locationDetail,
      severity: f.severity,
      status: f.status,
      isBlocking: f.isBlocking,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      tank: f.tank,
      tankProcess: f.tankProcess,
      criteria: f.criteria,
      createdByUser: f.createdByUser,
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

  static async getFindingById(id: string) {
    const finding = await FindingRepository.findById(id);
    if (!finding) {
      throw new HTTPException(404, { message: "Finding not found", cause: "FINDING_NOT_FOUND" });
    }
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "FINDING");
    return { ...finding, attachments };
  }

  static async updateFinding(id: string, data: UpdateFindingRequest) {
    const finding = await FindingRepository.findById(id);
    if (!finding) {
      throw new HTTPException(404, { message: "Finding not found", cause: "FINDING_NOT_FOUND" });
    }
    if (finding.status === FindingStatusEnum.CLOSE) {
      throw new HTTPException(422, { message: "Cannot update a closed finding", cause: "FINDING_TERMINAL" });
    }

    await pgsql.$transaction(async (tx) => {
      await tx.finding.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          locationDetail: data.locationDetail,
          severity: data.severity,
          isBlocking: data.isBlocking,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, id, "FINDING");
      }
    });

    return FindingRepository.findById(id);
  }

  static async updateFindingStatus(id: string, data: UpdateFindingStatusRequest, userId: string) {
    const finding = await FindingRepository.findById(id);
    if (!finding) {
      throw new HTTPException(404, { message: "Finding not found", cause: "FINDING_NOT_FOUND" });
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[finding.status] ?? [];
    if (!allowed.includes(data.status)) {
      throw new HTTPException(422, {
        message: `Cannot transition finding from ${finding.status} to ${data.status}`,
        cause: "INVALID_STATUS_TRANSITION",
      });
    }

    const isClosing = data.status === FindingStatusEnum.CLOSE;
    await FindingRepository.update(id, {
      status: data.status,
      ...(isClosing && { closedBy: userId, closedAt: new Date() }),
    });

    if (finding.createdBy && finding.createdBy !== userId) {
      await NotificationService.createNotificationForUser({
        userId: finding.createdBy,
        title: "Finding Status Updated",
        description: `Finding ${finding.findingNo} status changed to ${data.status}.`,
        type: "FINDING_STATUS_UPDATED",
        metadata: {
          targetType: "FINDING",
          targetId: id,
          tankId: finding.tankId,
          tankNo: finding.tank.tankNo,
        },
      });
    }

    return FindingRepository.findById(id);
  }

  static async bulkCloseFindings(data: BulkCloseFindingsRequest, userId: string) {
    const findings = await pgsql.finding.findMany({
      where: { id: { in: data.ids }, deletedAt: null },
      select: { id: true, status: true },
    });

    const toClose = findings.filter((f) => f.status !== FindingStatusEnum.CLOSE);

    if (toClose.length > 0) {
      await pgsql.finding.updateMany({
        where: { id: { in: toClose.map((f) => f.id) } },
        data: { status: FindingStatusEnum.CLOSE, closedBy: userId, closedAt: new Date() },
      });
    }

    return { closed: toClose.length, skipped: findings.length - toClose.length };
  }

  static async deleteFinding(id: string) {
    const finding = await FindingRepository.findById(id);
    if (!finding) {
      throw new HTTPException(404, { message: "Finding not found", cause: "FINDING_NOT_FOUND" });
    }
    if (finding.status !== FindingStatusEnum.CLOSE) {
      throw new HTTPException(422, {
        message: "Only CLOSE findings can be deleted",
        cause: "FINDING_NOT_TERMINAL",
      });
    }
    await FindingRepository.softDelete(id);
  }
}
