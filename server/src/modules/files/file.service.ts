// src/modules/files/file.service.ts
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { minioConfig } from "@/config/env";
import { minioClient, BUCKET } from "@/lib/minio";
import { generateRandomFilename } from "@/utils/generator";
import { createFileData } from "@/modules/files/file.types";
import { FileRepository } from "@/modules/files/file.repository";
import { processFile, processImage, type AspectRatio, type CropRect } from "@/utils/file-processing";

export class FileService {
  static async generateFileRecord(file: File, module: string, aspectRatio: AspectRatio = "1:1", cropRect?: CropRect): Promise<createFileData> {
    let fileProcessed: Buffer;
    let randomFileName: string;
    let fileType: string;

    if (file.type.startsWith("image/")) {
      fileProcessed = await processImage(file, aspectRatio, cropRect);
      randomFileName = generateRandomFilename(file.name, "webp");
      fileType = "webp";
    } else {
      fileType = file.type.split("/")[1];
      fileProcessed = await processFile(file, fileType);
      randomFileName = generateRandomFilename(file.name, fileType);
    }

    const storageKey = `${module}/${randomFileName}`;
    const url = `${minioConfig.ENDPOINT}/${BUCKET}/${storageKey}`;

    return {
      url,
      isUsed: false,
      size: fileProcessed.length,
      path: storageKey,
      metadata: { originalName: file.name, mimeType: fileType },
      module,
      imageBuffer: fileProcessed,
    };
  }

  static async uploadFileToStorage(c: Context, fileRecord: createFileData) {
    await minioClient.putObject(BUCKET, fileRecord.path!, fileRecord.imageBuffer!, fileRecord.size!, { "Content-Type": `image/${fileRecord.metadata?.mimeType}` });
  }

  static async deleteFile(c: Context, fileId: string) {
    const fileRecord = await FileRepository.getFileRecordById(fileId);
    if (!fileRecord) throw new Error("File not found");
    await minioClient.removeObject(BUCKET, fileRecord.path);
    await FileRepository.deleteFileRecord(fileId);
  }

  static async getFileRecordByTargetId(targetId: string, module: string) {
    return await FileRepository.getFileRecordByTargetId(targetId, module);
  }

  static getFileRecordByTargetIdDirectly(targetId: string, module: string) {
    return FileRepository.getFileRecordByTargetId(targetId, module);
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
