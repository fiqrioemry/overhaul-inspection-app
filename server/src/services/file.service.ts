import { Context } from "hono";
import dbConfig from "@/config/constant/database";
import { processImage } from "@/utils/file-processing";
import { minioClient, BUCKET } from "@/config/storage/minio";
import { generateRandomFilename } from "@/utils/generator";
import { FileRepository } from "@/repositories/file.repository";

export class FileService {
  static async uploadSingleFile(c: Context, userId: string, file: File, module: string, targetId?: string, isUsed?: boolean) {
    const imageProcessed = await processImage(file, 500, 500, "webp");
    const randomFileName = generateRandomFilename(file.name, "webp");
    const storageKey = `${module}/${randomFileName}`;

    // Upload ke MinIO
    await minioClient.putObject(BUCKET, storageKey, imageProcessed, imageProcessed.length, {
      "Content-Type": "image/webp",
    });

    const url = `${process.env.MINIO_ENDPOINT}/${BUCKET}/${storageKey}`;

    const fileRecord = {
      targetId,
      isUsed,
      url,
      size: imageProcessed.length,
      path: storageKey, // simpan storageKey sebagai path
      metadata: { originalName: file.name, mimeType: "image/webp" },
      module,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: userId,
    };

    return await FileRepository.createFileRecord(fileRecord);
  }

  static async deleteFile(c: Context, fileId: string) {
    const fileRecord = await FileRepository.getFileRecordById(fileId);
    if (!fileRecord) throw new Error("File not found");

    // Hapus dari MinIO
    await minioClient.removeObject(BUCKET, fileRecord.path);

    await FileRepository.deleteFileRecord(fileId);
  }

  static async uploadMultipleFiles(c: Context, userId: string, files: File[], module: string) {
    return await Promise.all(
      files.map(async (f) => {
        const imageProcessed = await processImage(f, 500, 500, "webp");
        const randomFileName = generateRandomFilename(f.name, "webp");
        const storageKey = `${module}/${randomFileName}`;

        await minioClient.putObject(BUCKET, storageKey, imageProcessed, imageProcessed.length, {
          "Content-Type": "image/webp",
        });

        const url = `${process.env.MINIO_ENDPOINT}/${BUCKET}/${storageKey}`;

        return await FileRepository.createFileRecord({
          url,
          size: f.size,
          path: storageKey,
          metadata: { originalName: f.name, mimeType: f.type },
          module,
          createdBy: userId,
        });
      }),
    );
  }

  static async getFileRecordByTargetId(targetId: string, module: string) {
    return await FileRepository.getFileRecordByTargetId(targetId, module);
  }
}
