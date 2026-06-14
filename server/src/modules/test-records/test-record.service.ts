import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessResultEnum, ProcessStatusEnum } from "generated/prisma";
import { FileRepository } from "@/modules/files/file.repository";
import { NotificationService } from "@/modules/notifications/notification.service";
import { TankProcessRepository } from "@/modules/tank-processes/tank-process.repository";
import { TestRecordRepository } from "./test-record.repository";
import { CompleteTestRecordRequest, CreateTestRecordRequest, UpdateTestRecordRequest } from "./test-record.schema";

export class TestRecordService {
  static async createRecord(tankProcessId: string, data: CreateTestRecordRequest, userId: string) {
    const tankProcess = await pgsql.tankProcess.findUnique({
      where: { id: tankProcessId },
      include: { tank: { select: { id: true, tankNo: true } } },
    });
    if (!tankProcess) {
      throw new HTTPException(404, { message: "Tank process not found", cause: "PROCESS_NOT_FOUND" });
    }

    const record = await pgsql.$transaction(async (tx) => {
      const created = await tx.testRecord.create({
        data: {
          tankProcessId,
          testDate: data.testDate ? new Date(data.testDate) : undefined,
          testPressure: data.testPressure,
          pressureUnit: data.pressureUnit,
          holdingTime: data.holdingTime,
          testMedium: data.testMedium,
          leakIndication: data.leakIndication,
          result: data.result,
          remarks: data.remarks,
          createdBy: userId,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, created.id, "TEST_RECORD");
      }

      return created;
    });

    return TestRecordRepository.findById(record.id);
  }

  static async listByTankProcess(tankProcessId: string) {
    return TestRecordRepository.findByTankProcess(tankProcessId);
  }

  static async getById(id: string) {
    const record = await TestRecordRepository.findById(id);
    if (!record) {
      throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    }
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "TEST_RECORD");
    return { ...record, attachments };
  }

  static async updateRecord(id: string, data: UpdateTestRecordRequest) {
    const record = await TestRecordRepository.findById(id);
    if (!record) {
      throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    }

    await pgsql.$transaction(async (tx) => {
      await tx.testRecord.update({
        where: { id },
        data: {
          testDate: data.testDate ? new Date(data.testDate) : undefined,
          testPressure: data.testPressure,
          pressureUnit: data.pressureUnit,
          holdingTime: data.holdingTime,
          testMedium: data.testMedium,
          leakIndication: data.leakIndication,
          result: data.result,
          remarks: data.remarks,
        },
      });

      if (data.fileIds && data.fileIds.length > 0) {
        await FileRepository.linkFiles(tx, data.fileIds, id, "TEST_RECORD");
      }
    });

    return TestRecordRepository.findById(id);
  }

  static async completeRecord(id: string, data: CompleteTestRecordRequest, userId: string) {
    const record = await TestRecordRepository.findById(id);
    if (!record) {
      throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    }

    const result = data.result as ProcessResultEnum;

    await pgsql.$transaction(async (tx) => {
      await tx.testRecord.update({
        where: { id },
        data: { result, remarks: data.remarks },
      });

      await tx.tankProcess.update({
        where: { id: record.tankProcessId },
        data: {
          status: ProcessStatusEnum.COMPLETED,
          result,
          actualFinishDate: data.actualFinishDate ? new Date(data.actualFinishDate) : undefined,
        },
      });

      if (result === ProcessResultEnum.PASSED) {
        await TankProcessRepository.unlockEligibleProcesses(tx, record.tankProcess.tankId, record.tankProcess.processTemplateId);
      }
    });

    const admins = await pgsql.user.findMany({
      where: { role: { in: ["USER", "ADMIN"] }, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await NotificationService.createNotificationForUser({
        userId: admin.id,
        title: "Test Completed",
        description: `Test for process "${record.tankProcess.name}" completed with result ${result}.`,
        type: "TEST_RESULT_UPDATED",
        metadata: {
          targetType: "TEST_RECORD",
          targetId: id,
          tankId: record.tankProcess.tankId,
          tankNo: record.tankProcess.tank.tankNo,
          processName: record.tankProcess.name,
        },
      });
    }

    return TestRecordRepository.findById(id);
  }

  static async deleteRecord(id: string) {
    const record = await TestRecordRepository.findById(id);
    if (!record) {
      throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    }
    await TestRecordRepository.delete(id);
  }
}
