import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessStatusEnum, InspectionRequestStatusEnum } from "generated/prisma";
import { EligibilityService } from "@/services/eligibility.service";
import { NotificationService } from "@/modules/notifications/notification.service";
import { InspectionRequestRepository } from "./inspection-request.repository";
import {
  CreateInspectionRequestRequest,
  ListInspectionRequestsQuery,
  ReviewInspectionRequestRequest,
} from "./inspection-request.schema";

function padSeq(n: number): string {
  return String(n + 1).padStart(4, "0");
}

export class InspectionRequestService {
  static async createRequest(data: CreateInspectionRequestRequest, userId: string) {
    const tankProcess = await pgsql.tankProcess.findUnique({
      where: { id: data.tankProcessId },
      include: { tank: { select: { id: true, tankNo: true } } },
    });

    if (!tankProcess) {
      throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
    }

    if (
      tankProcess.status !== ProcessStatusEnum.IN_PROGRESS &&
      tankProcess.status !== ProcessStatusEnum.REVIEWED
    ) {
      throw new HTTPException(422, {
        message: "Inspection request can only be created when process is IN_PROGRESS or REVIEWED",
        cause: "INVALID_PROCESS_STATE",
      });
    }

    const eligibility = await EligibilityService.checkEligibility(data.tankProcessId);
    if (!eligibility.eligible) {
      throw new HTTPException(422, {
        message: `Process not eligible: ${eligibility.reasons.join("; ")}`,
        cause: "NOT_ELIGIBLE",
      });
    }

    const count = await InspectionRequestRepository.countByTankNo(tankProcess.tank.tankNo);
    const requestNo = `REQ-${tankProcess.tank.tankNo}-${padSeq(count)}`;

    const request = await pgsql.$transaction(async (tx) => {
      const newRequest = await tx.inspectionRequest.create({
        data: {
          tankProcessId: data.tankProcessId,
          requestNo,
          requestedBy: userId,
          status: InspectionRequestStatusEnum.SUBMITTED,
          notes: data.notes,
          requestedAt: new Date(),
        },
      });

      await tx.tankProcess.update({
        where: { id: data.tankProcessId },
        data: { status: ProcessStatusEnum.WAITING_REVIEW },
      });

      return newRequest;
    });

    const reviewers = await pgsql.user.findMany({
      where: { role: "USER", status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });

    for (const reviewer of reviewers) {
      await NotificationService.createNotificationForUser({
        userId: reviewer.id,
        title: "Inspection Review Requested",
        description: `Request ${requestNo} for process "${tankProcess.name}" on tank ${tankProcess.tank.tankNo} requires your review.`,
        type: "INSPECTION_REVIEW_REQUESTED",
        metadata: {
          targetType: "INSPECTION_REQUEST",
          targetId: request.id,
          tankId: tankProcess.tankId,
          tankNo: tankProcess.tank.tankNo,
          processName: tankProcess.name,
        },
      });
    }

    return InspectionRequestRepository.findById(request.id);
  }

  static async listRequests(query: ListInspectionRequestsQuery) {
    const { requests, total } = await InspectionRequestRepository.findMany(query);
    return {
      data: requests,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / query.limit) : 0,
      },
    };
  }

  static async getRequestById(id: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) {
      throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });
    }
    return request;
  }

  static async cancelRequest(id: string, userId: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) {
      throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });
    }

    if (request.requestedBy !== userId) {
      throw new HTTPException(403, { message: "Only the requester can cancel this request", cause: "FORBIDDEN" });
    }

    if (
      request.status !== InspectionRequestStatusEnum.DRAFT &&
      request.status !== InspectionRequestStatusEnum.SUBMITTED
    ) {
      throw new HTTPException(422, {
        message: "Only DRAFT or SUBMITTED requests can be cancelled",
        cause: "INVALID_REQUEST_STATUS",
      });
    }

    await pgsql.$transaction(async (tx) => {
      await tx.inspectionRequest.update({
        where: { id },
        data: { status: InspectionRequestStatusEnum.CANCELLED },
      });
      await tx.tankProcess.update({
        where: { id: request.tankProcessId },
        data: { status: ProcessStatusEnum.IN_PROGRESS },
      });
    });
  }

  static async reviewRequest(id: string, data: ReviewInspectionRequestRequest, userId: string) {
    const request = await InspectionRequestRepository.findById(id);
    if (!request) {
      throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });
    }

    if (request.status !== InspectionRequestStatusEnum.SUBMITTED) {
      throw new HTTPException(422, {
        message: "Only SUBMITTED requests can be reviewed",
        cause: "INVALID_REQUEST_STATUS",
      });
    }

    const newStatus =
      data.status === "REVIEWED"
        ? InspectionRequestStatusEnum.REVIEWED
        : InspectionRequestStatusEnum.RETURNED;

    const newProcessStatus =
      data.status === "REVIEWED" ? ProcessStatusEnum.REVIEWED : ProcessStatusEnum.IN_PROGRESS;

    await pgsql.$transaction(async (tx) => {
      await tx.inspectionRequest.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedBy: userId,
          reviewNotes: data.reviewNotes,
          reviewedAt: new Date(),
        },
      });
      await tx.tankProcess.update({
        where: { id: request.tankProcessId },
        data: { status: newProcessStatus },
      });
    });

    if (request.requestedBy) {
      await NotificationService.createNotificationForUser({
        userId: request.requestedBy,
        title: data.status === "REVIEWED" ? "Inspection Request Reviewed" : "Inspection Request Returned",
        description:
          data.status === "REVIEWED"
            ? `Your request ${request.requestNo} has been reviewed and approved.`
            : `Your request ${request.requestNo} has been returned. Notes: ${data.reviewNotes ?? "-"}`,
        type: "INSPECTION_REVIEWED",
        metadata: {
          targetType: "INSPECTION_REQUEST",
          targetId: request.id,
          tankNo: request.tankProcess.tank.tankNo,
          processName: request.tankProcess.processTemplate.name,
        },
      });
    }

    return InspectionRequestRepository.findById(id);
  }
}
