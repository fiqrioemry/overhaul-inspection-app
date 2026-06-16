import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { RadiographyJointResultEnum } from "generated/prisma";
import { FileRepository } from "@/modules/files/file.repository";
import { NotificationService } from "@/modules/notifications/notification.service";
import { RadiographyRepository } from "./radiography.repository";
import {
  AddJointResultRequest,
  CreateRadiographyRequest,
  UpdateJointResultRequest,
  UpdateRadiographyRequest,
} from "./radiography.schema";
import type { RadiographyTestListItem, RadiographyTestDetail } from "./radiography.types";

export class RadiographyService {
  static async createRadiography(tankProcessId: string, data: CreateRadiographyRequest, userId: string) {
    const tankProcess = await pgsql.tankProcess.findUnique({
      where: { id: tankProcessId },
      include: { tank: { select: { id: true, tankNo: true } } },
    });
    if (!tankProcess) {
      throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
    }

    const radiography = await pgsql.$transaction(async (tx) => {
      const created = await tx.radiographyTest.create({
        data: {
          tankProcessId,
          testDate: data.testDate ? new Date(data.testDate) : undefined,
          area: data.area,
          remarks: data.remarks,
          createdBy: userId,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, created.id, "RADIOGRAPHY_TEST");
      }

      return created;
    });

    return RadiographyRepository.findById(radiography.id);
  }

  static async listByTankProcess(tankProcessId: string): Promise<RadiographyTestListItem[]> {
    const tests = await RadiographyRepository.findByTankProcess(tankProcessId);
    return tests.map((t) => ({
      id: t.id,
      tankProcessId: t.tankProcessId,
      testDate: t.testDate,
      area: t.area,
      totalJoint: t.totalJoint,
      totalShot: t.totalShot,
      totalAccepted: t.totalAccepted,
      totalRepair: t.totalRepair,
      totalReshoot: t.totalReshoot,
      result: t.result,
      remarks: t.remarks,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      createdByUser: t.createdByUser,
      _count: t._count,
    }));
  }

  static async getById(id: string): Promise<RadiographyTestDetail> {
    const test = await RadiographyRepository.findById(id);
    if (!test) {
      throw new HTTPException(404, { message: "Radiography test not found", cause: "RADIOGRAPHY_NOT_FOUND" });
    }
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "RADIOGRAPHY_TEST");
    return {
      id: test.id,
      tankProcessId: test.tankProcessId,
      testDate: test.testDate,
      area: test.area,
      totalJoint: test.totalJoint,
      totalShot: test.totalShot,
      totalAccepted: test.totalAccepted,
      totalRepair: test.totalRepair,
      totalReshoot: test.totalReshoot,
      result: test.result,
      remarks: test.remarks,
      createdBy: test.createdBy,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      tankProcess: test.tankProcess,
      createdByUser: test.createdByUser,
      jointResults: test.jointResults,
      attachments: attachments.map((a) => ({
        id: a.id,
        url: a.url,
        path: a.path,
        module: a.module,
        isUsed: a.isUsed,
        createdAt: a.createdAt,
      })),
    };
  }

  static async updateRadiography(id: string, data: UpdateRadiographyRequest) {
    const test = await RadiographyRepository.findById(id);
    if (!test) {
      throw new HTTPException(404, { message: "Radiography test not found", cause: "RADIOGRAPHY_NOT_FOUND" });
    }

    await pgsql.$transaction(async (tx) => {
      await tx.radiographyTest.update({
        where: { id },
        data: {
          testDate: data.testDate ? new Date(data.testDate) : undefined,
          area: data.area,
          result: data.result,
          remarks: data.remarks,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, id, "RADIOGRAPHY_TEST");
      }
    });

    return RadiographyRepository.findById(id);
  }

  static async deleteRadiography(id: string) {
    const test = await RadiographyRepository.findById(id);
    if (!test) {
      throw new HTTPException(404, { message: "Radiography test not found", cause: "RADIOGRAPHY_NOT_FOUND" });
    }
    await RadiographyRepository.delete(id);
  }

  static async addJoint(radiographyTestId: string, data: AddJointResultRequest) {
    const test = await RadiographyRepository.findById(radiographyTestId);
    if (!test) {
      throw new HTTPException(404, { message: "Radiography test not found", cause: "RADIOGRAPHY_NOT_FOUND" });
    }

    await RadiographyRepository.createJoint({
      radiographyTest: { connect: { id: radiographyTestId } },
      jointNo: data.jointNo,
      location: data.location,
      weldType: data.weldType,
      welderNo: data.welderNo,
      filmNo: data.filmNo,
      result: data.result,
      defectType: data.defectType,
      repairStatus: data.repairStatus,
      remarks: data.remarks,
    });

    const updated = await RadiographyRepository.recalculateTotals(radiographyTestId);

    const hasRepair = updated.totalRepair > 0 || updated.totalReshoot > 0;
    if (data.result === RadiographyJointResultEnum.REPAIR || data.result === RadiographyJointResultEnum.RESHOOT) {
      const process = await pgsql.tankProcess.findUnique({ where: { id: test.tankProcessId } });
      if (process) {
        const users = await pgsql.user.findMany({
          where: { role: { in: ["ADMIN", "USER"] }, status: "ACTIVE", deletedAt: null },
          select: { id: true },
        });
        for (const user of users) {
          await NotificationService.createNotificationForUser({
            userId: user.id,
            title: "Radiography Repair Required",
            description: `Joint ${data.jointNo} requires ${data.result} on process "${process.name}".`,
            type: "RADIOGRAPHY_RESULT_UPDATED",
            metadata: {
              targetType: "RADIOGRAPHY_TEST",
              targetId: radiographyTestId,
              tankId: process.tankId,
              processName: process.name,
            },
          });
        }
      }
    }

    return RadiographyRepository.findById(radiographyTestId);
  }

  static async updateJoint(id: string, data: UpdateJointResultRequest) {
    const joint = await RadiographyRepository.findJointById(id);
    if (!joint) {
      throw new HTTPException(404, { message: "Joint result not found", cause: "JOINT_NOT_FOUND" });
    }

    await RadiographyRepository.updateJoint(id, {
      jointNo: data.jointNo,
      location: data.location,
      weldType: data.weldType,
      welderNo: data.welderNo,
      filmNo: data.filmNo,
      result: data.result,
      defectType: data.defectType,
      repairStatus: data.repairStatus,
      remarks: data.remarks,
    });

    return RadiographyRepository.recalculateTotals(joint.radiographyTestId);
  }

  static async deleteJoint(id: string) {
    const joint = await RadiographyRepository.findJointById(id);
    if (!joint) {
      throw new HTTPException(404, { message: "Joint result not found", cause: "JOINT_NOT_FOUND" });
    }
    await RadiographyRepository.deleteJoint(id);
    return RadiographyRepository.recalculateTotals(joint.radiographyTestId);
  }
}
