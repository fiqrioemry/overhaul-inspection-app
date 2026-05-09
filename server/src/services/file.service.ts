import { Context } from "hono";
import dbConfig from "@/config/constant/database";
import { processImage } from "@/utils/file-processing";
import { generateRandomFilename } from "@/utils/generator";
import { FileRepository } from "@/repositories/file.repository";

export class FileService {
  static async uploadSingleFile(c: Context, userId: string, file: File, module: string, targetId?: string): Promise<any> {
    const imageProcessed = await processImage(file, 500, 500, "webp");
    const randomFileName = generateRandomFilename(file.name, module, "webp");
    const filePath = `/uploads/${randomFileName}`;
    await Bun.write(`.${filePath}`, imageProcessed);

    const metadata = {
      originalName: file.name,
      mimeType: "image/webp",
    };

    const fileRecord = {
      targetId,
      url: `${dbConfig.serverUrl}${filePath}`,
      size: imageProcessed.length,
      path: filePath,
      metadata,
      module,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: userId,
    };

    return await FileRepository.createFileRecord(fileRecord);
  }

  static async deleteFile(c: Context, fileId: string): Promise<void> {
    const fileRecord = await FileRepository.getFileRecordById(fileId);
    if (!fileRecord) {
      throw new Error("File not found");
    }

    const file = Bun.file(`.${fileRecord.path}`);

    await file.delete();

    await FileRepository.deleteFileRecord(fileId);
  }

  static async uploadMultipleFiles(c: Context, userId: string, files: File[], module: string): Promise<any> {
    const results = await Promise.all(
      files.map(async (f) => {
        const arrayBuffer = await f.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const randomFileName = generateRandomFilename(f.name, module);
        const filePath = `/uploads/${randomFileName}`;
        await Bun.write(`.${filePath}`, buffer);

        const metadata = {
          originalName: f.name,
          mimeType: f.type,
        };

        const fileRecord = {
          url: `${dbConfig.serverUrl}${filePath}`,
          size: f.size,
          path: filePath,
          metadata,
          module,
          createdBy: userId,
        };

        return await FileRepository.createFileRecord(fileRecord);
      }),
    );

    return results;
  }
}
