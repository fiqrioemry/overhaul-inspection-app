import { Context } from "hono";
import errorCodes from "@/config/constant/errorCode";
import { FileService } from "@/services/file.service";
import errorMessages from "@/config/constant/errorMessage";
import { responseError, responseOK } from "@/utils/response";
import successMessages from "@/config/constant/successMessage";

export class FileController {
  static async singleUpload(c: Context) {
    const user = c.get("user");
    const file = await c.get("file");

    if (!file) {
      return responseError(c, errorMessages.fileNotFound, 404, errorCodes.fileNotFound);
    }
    const response = await FileService.uploadSingleFile(c, user.userId, file, c.req.param("module"));
    return responseOK(c, successMessages.fileUploadSuccess, response);
  }

  static async multiUpload(c: Context) {
    const userId = c.get("user")?.userId;
    const files = await c.get("files");
    if (!files || !Array.isArray(files) || files.length === 0) {
      return responseError(c, errorMessages.fileNotFound, 404, errorCodes.fileNotFound);
    }
    const response = await FileService.uploadMultipleFiles(c, userId, files, c.req.param("module"));
    return responseOK(c, successMessages.filesUploadSuccess, response);
  }

  static async delete(c: Context) {
    const fileId = c.req.param("fileId");
    if (!fileId) {
      return responseError(c, errorMessages.fileIdRequired, 400, errorCodes.badRequest);
    }
    await FileService.deleteFile(c, fileId);
    return responseOK(c, successMessages.fileDeleteSuccess);
  }
}
