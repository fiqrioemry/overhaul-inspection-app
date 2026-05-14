import { Context } from "hono";
import { FileService } from "@/modules/files/file.service";
import { responseError, responseOK } from "@/utils/response";
import { fileErrorMessage, fileSuccessMessage } from "@/config/constant/file.constant";

export class FileController {
  static async singleUpload(c: Context) {
    const user = c.get("user");
    const file = await c.get("file");

    if (!file) {
      return responseError(c, fileErrorMessage.FILE_NOT_FOUND, 404, fileErrorMessage.FILE_NOT_FOUND);
    }
    const response = await FileService.uploadSingleFile(c, user.userId, file, c.req.param("module"));
    return responseOK(c, fileSuccessMessage.UPLOAD_FILE_SUCCESS, response);
  }

  static async multiUpload(c: Context) {
    const userId = c.get("user")?.userId;
    const files = await c.get("files");
    if (!files || !Array.isArray(files) || files.length === 0) {
      return responseError(c, fileErrorMessage.FILE_NOT_FOUND, 404, fileErrorMessage.FILE_NOT_FOUND);
    }
    const response = await FileService.uploadMultipleFiles(c, userId, files, c.req.param("module"));
    return responseOK(c, fileSuccessMessage.UPLOAD_FILE_SUCCESS, response);
  }

  static async delete(c: Context) {
    const fileId = c.req.param("fileId");
    if (!fileId) {
      return responseError(c, fileErrorMessage.FILE_ID_REQUIRED, 400, fileErrorMessage.FILE_ID_REQUIRED);
    }
    await FileService.deleteFile(c, fileId);
    return responseOK(c, fileSuccessMessage.DELETE_FILE_SUCCESS);
  }
}
