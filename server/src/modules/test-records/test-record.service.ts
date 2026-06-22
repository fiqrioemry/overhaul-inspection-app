import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { ProcessResultEnum, TestResultStatusEnum, InspectionRequestStatusEnum } from "generated/prisma";
import { FileService } from "@/modules/files/file.service";
import { TestRecordRepository } from "./test-record.repository";
import { TestRecordAttachmentRepository } from "./test-record-attachment.repository";
import type { CreateTestRecordRequest, UpdateTestRecordRequest } from "./test-record.schema";
import type { TestRecordItem } from "./test-record.types";

const MAX_ATTACHMENTS = 15;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

function validateFiles(files: File[]) {
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new HTTPException(400, { message: `File "${file.name}" has unsupported type ${file.type}.`, cause: "INVALID_FILE_TYPE" });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new HTTPException(400, { message: `File "${file.name}" exceeds the 15 MB size limit.`, cause: "FILE_TOO_LARGE" });
    }
  }
}

function deriveResult(status: TestResultStatusEnum, explicit?: ProcessResultEnum): ProcessResultEnum {
  if (explicit) return explicit;
  if (status === TestResultStatusEnum.PASSED) return ProcessResultEnum.PASSED;
  if (status === TestResultStatusEnum.REPAIR) return ProcessResultEnum.FAILED;
  return ProcessResultEnum.PENDING;
}

function mapRecord(r: NonNullable<Awaited<ReturnType<typeof TestRecordRepository.findById>>>): TestRecordItem {
  return {
    id: r.id,
    inspectionRequestId: r.inspectionRequestId,
    inspectionRequestItemId: r.inspectionRequestItemId,
    tankProcessId: r.tankProcessId,
    testDate: r.testDate,
    testPressure: r.testPressure,
    pressureUnit: r.pressureUnit,
    holdingTime: r.holdingTime,
    testMedium: r.testMedium,
    leakIndication: r.leakIndication,
    status: r.status,
    result: r.result,
    remarks: r.remarks,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    inspectionRequest: r.inspectionRequest,
    inspectionRequestItem: r.inspectionRequestItem,
    tankProcess: r.tankProcess,
    createdByUser: r.createdByUser,
    attachments: r.attachments,
  };
}

async function uploadAttachmentFiles(c: Context, files: File[]) {
  const fileRecords = await Promise.all(files.map((f) => FileService.generateFileRecord(f, "TEST_RECORD")));
  await Promise.all(fileRecords.map((fr) => FileService.uploadFileToStorage(c, fr)));
  return fileRecords;
}

export class TestRecordService {
  static async createByRequest(c: Context, inspectionRequestId: string, data: CreateTestRecordRequest, files: File[], userId: string, userRole: string) {
    const request = await pgsql.inspectionRequest.findFirst({
      where: { id: inspectionRequestId, deletedAt: null },
      select: { id: true, status: true, tankProcessId: true },
    });
    if (!request) throw new HTTPException(404, { message: "Inspection request not found", cause: "REQUEST_NOT_FOUND" });

    if (request.status === InspectionRequestStatusEnum.NOT_STARTED) {
      throw new HTTPException(422, {
        message: "Test record can only be added after the signed request form has been uploaded and the request status is IN_PROCESS",
        cause: "REQUEST_NOT_CONFIRMED",
      });
    }
    if (request.status === InspectionRequestStatusEnum.PASSED && !ADMIN_ROLES.has(userRole)) {
      throw new HTTPException(403, { message: "Only ADMIN/SUPER_ADMIN can modify test records of a PASSED request", cause: "FORBIDDEN" });
    }

    if (data.inspectionRequestItemId) {
      const item = await pgsql.inspectionRequestItem.findFirst({
        where: { id: data.inspectionRequestItemId, inspectionRequestId },
        select: { id: true },
      });
      if (!item) throw new HTTPException(422, { message: "Inspection object does not belong to this request", cause: "ITEM_MISMATCH" });
    }

    if (files.length > MAX_ATTACHMENTS) {
      throw new HTTPException(400, { message: `Maximum ${MAX_ATTACHMENTS} attachments are allowed`, cause: "ATTACHMENT_LIMIT_EXCEEDED" });
    }
    validateFiles(files);

    const fileRecords = files.length > 0 ? await uploadAttachmentFiles(c, files) : [];

    const created = await pgsql.$transaction(async (tx) => {
      const record = await tx.testRecord.create({
        data: {
          inspectionRequestId,
          inspectionRequestItemId: data.inspectionRequestItemId ?? null,
          tankProcessId: request.tankProcessId ?? null,
          testDate: data.testDate ? new Date(data.testDate) : undefined,
          testPressure: data.testPressure,
          pressureUnit: data.pressureUnit,
          holdingTime: data.holdingTime,
          testMedium: data.testMedium,
          leakIndication: data.leakIndication,
          status: data.status,
          result: deriveResult(data.status, data.result),
          remarks: data.remarks,
          createdBy: userId,
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
                module: "TEST_RECORD",
                size: fr.size!,
                createdBy: userId,
                mimeType: fr.mimeType ?? null,
              },
              select: { id: true, url: true },
            }),
          ),
        );
        await TestRecordAttachmentRepository.createMany(
          tx,
          storedFiles.map((f, idx) => ({
            testRecordId: record.id,
            fileStorageId: f.id,
            attachmentUrl: f.url,
            sortOrder: idx,
            caption: data.newFileCaptions?.[idx] ?? undefined,
          })),
        );
      }

      return record;
    });

    const full = await TestRecordRepository.findById(created.id);
    return mapRecord(full!);
  }

  static async listByRequest(inspectionRequestId: string): Promise<TestRecordItem[]> {
    const records = await TestRecordRepository.findByRequest(inspectionRequestId);
    return records.map(mapRecord);
  }

  static async listByTankProcess(tankProcessId: string): Promise<TestRecordItem[]> {
    const records = await TestRecordRepository.findByTankProcess(tankProcessId);
    return records.map(mapRecord);
  }

  static async getById(id: string): Promise<TestRecordItem> {
    const record = await TestRecordRepository.findById(id);
    if (!record) throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    return mapRecord(record);
  }

  static async updateRecord(c: Context, id: string, data: UpdateTestRecordRequest, files: File[], userId: string, userRole: string) {
    const record = await TestRecordRepository.findById(id);
    if (!record) throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });

    if (record.inspectionRequest?.status === InspectionRequestStatusEnum.PASSED && !ADMIN_ROLES.has(userRole)) {
      throw new HTTPException(403, { message: "Only ADMIN/SUPER_ADMIN can modify test records of a PASSED request", cause: "FORBIDDEN" });
    }

    const removedIds = data.removedAttachmentIds ?? [];
    const active = await TestRecordAttachmentRepository.findActiveByTestRecordId(id);
    const countAfterRemoval = active.length - removedIds.filter((rid) => active.some((a) => a.id === rid)).length;
    if (countAfterRemoval + files.length > MAX_ATTACHMENTS) {
      throw new HTTPException(400, { message: `Maximum ${MAX_ATTACHMENTS} attachments are allowed`, cause: "ATTACHMENT_LIMIT_EXCEEDED" });
    }
    validateFiles(files);

    const removed = removedIds.length > 0 ? await TestRecordAttachmentRepository.findActiveByIds(removedIds, id) : [];
    const fileRecords = files.length > 0 ? await uploadAttachmentFiles(c, files) : [];

    const nextStatus = data.status ?? (record.status as TestResultStatusEnum);

    await pgsql.$transaction(async (tx) => {
      if (removedIds.length > 0) {
        await TestRecordAttachmentRepository.softDeleteByIds(tx, removedIds, id);
        const removedFileIds = removed.map((r) => r.fileStorageId);
        if (removedFileIds.length > 0) {
          await tx.fileStorage.updateMany({ where: { id: { in: removedFileIds } }, data: { isUsed: false } });
        }
      }

      if (fileRecords.length > 0) {
        const storedFiles = await Promise.all(
          fileRecords.map((fr) =>
            tx.fileStorage.create({
              data: {
                url: fr.url!,
                isUsed: true,
                path: fr.path!,
                meta: fr.metadata!,
                module: "TEST_RECORD",
                size: fr.size!,
                createdBy: userId,
                mimeType: fr.mimeType ?? null,
              },
              select: { id: true, url: true },
            }),
          ),
        );
        await TestRecordAttachmentRepository.createMany(
          tx,
          storedFiles.map((f, idx) => ({
            testRecordId: id,
            fileStorageId: f.id,
            attachmentUrl: f.url,
            sortOrder: countAfterRemoval + idx,
          })),
        );
      }

      await tx.testRecord.update({
        where: { id },
        data: {
          ...(data.inspectionRequestItemId !== undefined && { inspectionRequestItemId: data.inspectionRequestItemId }),
          ...(data.testDate && { testDate: new Date(data.testDate) }),
          ...(data.testPressure !== undefined && { testPressure: data.testPressure }),
          ...(data.pressureUnit !== undefined && { pressureUnit: data.pressureUnit }),
          ...(data.holdingTime !== undefined && { holdingTime: data.holdingTime }),
          ...(data.testMedium !== undefined && { testMedium: data.testMedium }),
          ...(data.leakIndication !== undefined && { leakIndication: data.leakIndication }),
          ...(data.status !== undefined && { status: data.status }),
          result: deriveResult(nextStatus, data.result),
          ...(data.remarks !== undefined && { remarks: data.remarks }),
        },
      });
    });

    const full = await TestRecordRepository.findById(id);
    return mapRecord(full!);
  }

  static async deleteRecord(id: string, userRole: string) {
    const record = await TestRecordRepository.findById(id);
    if (!record) throw new HTTPException(404, { message: "Test record not found", cause: "TEST_RECORD_NOT_FOUND" });
    if (record.inspectionRequest?.status === InspectionRequestStatusEnum.PASSED && !ADMIN_ROLES.has(userRole)) {
      throw new HTTPException(403, { message: "Only ADMIN/SUPER_ADMIN can delete test records of a PASSED request", cause: "FORBIDDEN" });
    }
    await TestRecordRepository.delete(id);
  }
}
