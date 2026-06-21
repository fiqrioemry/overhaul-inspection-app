import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { HTTPException } from "hono/http-exception";
import { minioConfig } from "@/config/env";
import { minioClient, BUCKET } from "@/lib/minio";
import { generateRandomFilename } from "@/utils/generator";
import { createFileData, fileResponse } from "@/modules/files/file.types";
import { FileRepository } from "@/modules/files/file.repository";
import { processFile, processImage, processInspectionAttachment, type AspectRatio, type CropRect } from "@/utils/file-processing";
import type { ImageProcessMode } from "@/modules/files/file.types";

const INSPECTION_ATTACHMENT_MODULES = new Set(["DAILY_REPORT", "FINDING", "TEST_RECORD", "RADIOGRAPHY_TEST", "TANK"]);

export class FileService {
  static async generateFileRecord(
    file: File,
    module: string,
    aspectRatio: AspectRatio = "1:1",
    cropRect?: CropRect,
  ): Promise<createFileData> {
    const imageProcessMode: ImageProcessMode = INSPECTION_ATTACHMENT_MODULES.has(module) ? "inspection_attachment" : "avatar";
    let fileProcessed: Buffer;
    let randomFileName: string;
    let mimeType: string;
    let metadata: createFileData["metadata"];

    if (file.type.startsWith("image/")) {
      if (imageProcessMode === "inspection_attachment") {
        fileProcessed = await processInspectionAttachment(file);
        metadata = {
          originalName: file.name,
          mimeType: "image/webp",
          originalMimeType: file.type,
          processedMimeType: "image/webp",
          processMode: "inspection_attachment",
          resizeMode: "inside",
          maxWidth: 1920,
          maxHeight: 1920,
          cropped: false,
        };
      } else {
        fileProcessed = await processImage(file, aspectRatio, cropRect);
        metadata = { originalName: file.name, mimeType: "image/webp" };
      }
      randomFileName = generateRandomFilename(file.name, "webp");
      mimeType = "image/webp";
    } else {
      const ext = file.name.split(".").pop() ?? file.type.split("/")[1];
      fileProcessed = await processFile(file, ext);
      randomFileName = generateRandomFilename(file.name, ext);
      mimeType = file.type;
      metadata = { originalName: file.name, mimeType: file.type };
    }

    const storageKey = `${module}/${randomFileName}`;
    const url = `${minioConfig.ENDPOINT}/${BUCKET}/${storageKey}`;

    return {
      url,
      isUsed: true,
      size: fileProcessed.length,
      path: storageKey,
      mimeType,
      metadata,
      module,
      imageBuffer: fileProcessed,
    };
  }

  static async uploadFileToStorage(c: Context, fileRecord: createFileData) {
    await minioClient.putObject(BUCKET, fileRecord.path!, fileRecord.imageBuffer!, fileRecord.size!, { "Content-Type": fileRecord.mimeType ?? "application/octet-stream" });
  }

  static async uploadSingleFile(c: Context, userId: string, file: File, module: string): Promise<fileResponse> {
    const fileRecord = await this.generateFileRecord(file, module);

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.uploadFileToStorage(c, fileRecord);
      fileRecord.createdBy = userId;
      return await FileRepository.createFileRecordWithTx(tx, fileRecord);
    });
  }

  static async uploadMultipleFiles(c: Context, userId: string, files: File[], module: string): Promise<fileResponse[]> {
    const fileRecords = await Promise.all(files.map((f) => this.generateFileRecord(f, module)));

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await Promise.all(fileRecords.map((fr) => this.uploadFileToStorage(c, fr)));
      fileRecords.forEach((fr) => (fr.createdBy = userId));
      return await FileRepository.createMultipleFileRecordWithTx(tx, fileRecords);
    });
  }

  static async getFileById(fileId: string): Promise<fileResponse> {
    const fileRecord = await FileRepository.getFileRecordById(fileId);
    if (!fileRecord) {
      throw new HTTPException(404, { message: "File not found", cause: "FILE_NOT_FOUND" });
    }
    return fileRecord;
  }

  static async deleteFile(c: Context, fileId: string) {
    const fileRecord = await FileRepository.getFileRecordById(fileId);
    if (!fileRecord) {
      throw new HTTPException(404, { message: "File not found", cause: "FILE_NOT_FOUND" });
    }
    await minioClient.removeObject(BUCKET, fileRecord.path);
    await FileRepository.deleteFileRecord(fileId);
  }

  static async getFileRecordById(fileId: string) {
    return await FileRepository.getFileRecordById(fileId);
  }

  static getFileRecordByIdDirectly(fileId: string) {
    return FileRepository.getFileRecordById(fileId);
  }

  static async saveRecordToDatabase(fileRecord: createFileData, tx: Prisma.TransactionClient | null) {
    const db = tx ?? pgsql;
    return await FileRepository.createFileRecordWithTx(db, fileRecord);
  }

  static async saveBulkRecordsToDatabase(fileRecords: createFileData[], tx: Prisma.TransactionClient | null) {
    const db = tx ?? pgsql;
    return await FileRepository.createMultipleFileRecordWithTx(db, fileRecords);
  }
}
