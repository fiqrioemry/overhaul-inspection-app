import { Context } from "hono";
import { FileService } from "@/modules/files/file.service";
import { responseError, responseOK } from "@/utils/response";
import { fileErrorCode, fileErrorMessage, fileSuccessMessage } from "@/config/constant/file.constant";

export class FileController {
  static async upload(c: Context) {
    const user = c.get("user");
    const file = c.get("file");

    if (!file) {
      return responseError(c, fileErrorMessage.FILE_NOT_FOUND, 404, fileErrorCode.FILE_NOT_FOUND);
    }

    const module = c.req.query("module") || "GENERAL";
    const response = await FileService.uploadSingleFile(c, user.userId, file, module);
    return responseOK(c, fileSuccessMessage.UPLOAD_FILE_SUCCESS, response);
  }

  static async getById(c: Context) {
    const fileId = c.req.param("id");
    const response = await FileService.getFileById(fileId);
    return responseOK(c, "File retrieved successfully", response);
  }

  static async delete(c: Context) {
    const fileId = c.req.param("id");
    if (!fileId) {
      return responseError(c, fileErrorMessage.FILE_ID_REQUIRED, 400, fileErrorCode.FILE_ID_REQUIRED);
    }
    await FileService.deleteFile(c, fileId);
    return responseOK(c, fileSuccessMessage.DELETE_FILE_SUCCESS);
  }
}
