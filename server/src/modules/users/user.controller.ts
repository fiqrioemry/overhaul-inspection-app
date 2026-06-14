import { Context } from "hono";
import { UserService } from "@/modules/users/user.service";
import { responseError, responseOK } from "@/utils/response";
import { updateProfileRequest } from "@/modules/users/user.schema";
import { userSuccessMessage } from "@/config/constant/user.constant";
import { fileErrorCode, fileErrorMessage } from "@/config/constant/file.constant";

export class UserController {
  static async getUsers(c: Context) {
    const user = await c.get("user");
    const response = await UserService.getUsers();
    return responseOK(c, userSuccessMessage.GET_USERS_SUCCESS, response);
  }

  static async updateAvatar(c: Context) {
    const user = await c.get("user");
    const avatar = await c.get("avatar");

    if (!avatar) {
      return responseError(c, fileErrorMessage.FILE_NOT_FOUND, 404, fileErrorCode.FILE_NOT_FOUND);
    }
    await UserService.updateAvatar(c, user.userId, avatar);
    return responseOK(c, userSuccessMessage.UPDATE_AVATAR_SUCCESS);
  }

  static async updateProfile(c: Context) {
    const user = await c.get("user");
    const request = updateProfileRequest.parse(await c.req.json());
    request.userId = user.userId;
    await UserService.updateProfile(c, request);
    return responseOK(c, userSuccessMessage.UPDATE_PROFILE_SUCCESS);
  }
}
