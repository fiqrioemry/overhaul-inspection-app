import { HTTPException } from "hono/http-exception";
import { pgsql } from "@/lib/database";
import { ProcessResultEnum } from "generated/prisma";
import { FileRepository } from "@/modules/files/file.repository";
import { NotificationService } from "@/modules/notifications/notification.service";
import { TestRecordRepository } from "./test-record.repository";
import { CompleteTestRecordRequest, CreateTestRecordRequest, UpdateTestRecordRequest } from "./test-record.schema";
import type { TestRecordListItem, TestRecordDetail } from "./test-record.types";

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

  static async listByTankProcess(tankProcessId: string): Promise<TestRecordListItem[]> {
    const records = await TestRecordRepository.findByTankProcess(tankProcessId);
    return records.map((r) => ({
      id: r.id,
      tankProcessId: r.tankProcessId,
      testDate: r.testDate,
      testPressure: r.testPressure,
      pressureUnit: r.pressureUnit,
      holdingTime: r.holdingTime,
      testMedium: r.testMedium,
      leakIndication: r.leakIndication,
      result: r.result,
      remarks: r.remarks,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      createdByUser: r.createdByUser,
    }));
  }

  static async getById(id: string): Promise<TestRecordDetail> {
    const record = await TestRecordRepository.findById(id);
    if (!record) {
      throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    }
    const attachments = await FileRepository.getFileRecordsByTargetId(id, "TEST_RECORD");
    return {
      id: record.id,
      tankProcessId: record.tankProcessId,
      testDate: record.testDate,
      testPressure: record.testPressure,
      pressureUnit: record.pressureUnit,
      holdingTime: record.holdingTime,
      testMedium: record.testMedium,
      leakIndication: record.leakIndication,
      result: record.result,
      remarks: record.remarks,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      tankProcess: record.tankProcess,
      createdByUser: record.createdByUser,
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
