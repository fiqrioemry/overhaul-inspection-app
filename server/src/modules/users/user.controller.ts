import { Context } from "hono";
import { UserService } from "@/modules/users/user.service";
import { responseCreated, responseError, responseOK } from "@/utils/response";
import { updateProfileRequest, createUserRequest, updateUserRequest, updateUserStatusRequest, updateUserPasswordRequest, listUsersQuery } from "@/modules/users/user.schema";
import { userSuccessMessage } from "@/config/constant/user.constant";
import { fileErrorCode, fileErrorMessage } from "@/config/constant/file.constant";

export class UserController {
  static async createUser(c: Context) {
    const request = createUserRequest.parse(await c.req.json());
    const response = await UserService.createUser(request);
    return responseCreated(c, userSuccessMessage.CREATE_USER_SUCCESS, response);
  }

  static async listUsers(c: Context) {
    const query = listUsersQuery.parse(c.req.query());
    const response = await UserService.listUsers(query);
    return responseOK(c, userSuccessMessage.GET_USERS_SUCCESS, response.data, response.meta);
  }

  static async getUserById(c: Context) {
    const id = c.req.param("id");
    const response = await UserService.getUserById(id);
    return responseOK(c, userSuccessMessage.GET_USER_SUCCESS, response);
  }

  static async updateUser(c: Context) {
    const id = c.req.param("id");
    const avatarFile = c.get("avatar") as File | undefined;
    const body = await c.req.parseBody({ all: true });

    const request = updateUserRequest.parse({
      name: body["name"] || undefined,
      role: body["role"] || undefined,
    });

    const response = await UserService.updateUser(c, id, request, avatarFile);
    return responseOK(c, userSuccessMessage.UPDATE_USER_SUCCESS, response);
  }

  static async updateUserStatus(c: Context) {
    const id = c.req.param("id");
    const request = updateUserStatusRequest.parse(await c.req.json());
    const response = await UserService.updateUserStatus(id, request);
    return responseOK(c, userSuccessMessage.UPDATE_USER_STATUS_SUCCESS, response);
  }

  static async updateUserPassword(c: Context) {
    const id = c.req.param("id");
    const request = updateUserPasswordRequest.parse(await c.req.json());
    await UserService.updateUserPassword(id, request);
    return responseOK(c, userSuccessMessage.UPDATE_USER_PASSWORD_SUCCESS);
  }

  static async deleteUser(c: Context) {
    const id = c.req.param("id");
    await UserService.deleteUser(id);
    return responseOK(c, userSuccessMessage.DELETE_USER_SUCCESS);
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
