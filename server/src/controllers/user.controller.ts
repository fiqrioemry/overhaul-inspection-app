import { Context } from "hono";
import errorCodes from "@/config/constant/errorCode";
import { UserService } from "@/services/user.service";
import errorMessages from "@/config/constant/errorMessage";
import { responseError, responseOK } from "@/utils/response";
import successMessages from "@/config/constant/successMessage";
import { updateProfileRequest } from "@/schema/user.validation";

export class UserController {
  static async searchUsersByUsername(c: Context) {
    const username = c.req.query("search")!;
    const response = await UserService.searchUsersByUsername(username);
    return responseOK(c, successMessages.searchUsers, response);
  }

  static async getUserProfile(c: Context) {
    const user = await c.get("user");
    const username = c.req.param("username");
    const response = await UserService.getProfileByUsername(username, user.userId);
    return responseOK(c, successMessages.getProfile, response);
  }

  static async updateAvatar(c: Context) {
    const user = await c.get("user");
    const avatar = await c.get("avatar");

    if (!avatar) {
      return responseError(c, errorMessages.fileNotFound, 404, errorCodes.fileNotFound);
    }
    const response = await UserService.updateAvatar(c, user.userId, avatar);
    return responseOK(c, successMessages.updateAvatar, response);
  }

  static async updateProfile(c: Context) {
    const user = await c.get("user");
    const request = updateProfileRequest.parse(await c.req.json());
    const response = await UserService.updateProfile(c, user.userId, request);
    return responseOK(c, successMessages.updateProfile, response);
  }
}
