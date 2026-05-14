import { Context } from "hono";
import { UserService } from "@/modules/users/user.service";
import { responseError, responseOK } from "@/utils/response";
import { userSuccessMessage } from "@/config/constant/user.constant";
import { fileErrorCode, fileErrorMessage } from "@/config/constant/file.constant";
import { followUserRequest, updateProfileRequest } from "@/modules/users/user.schema";

export class UserController {
  static async searchUsersByUsername(c: Context) {
    const userId = c.get("user").userId;
    const username = c.req.query("search")!;
    const response = await UserService.searchUsersByUsername(username, userId);
    return responseOK(c, userSuccessMessage.SEARCH_USER_SUCCESS, response);
  }

  static async getUserProfile(c: Context) {
    const user = await c.get("user");
    const username = c.req.param("username");
    const response = await UserService.getProfileByUsername(username, user.userId);
    return responseOK(c, userSuccessMessage.GET_PROFILE_SUCCESS, response);
  }

  static async updateAvatar(c: Context) {
    const user = await c.get("user");
    const avatar = await c.get("avatar");

    if (!avatar) {
      return responseError(c, fileErrorMessage.FILE_NOT_FOUND, 404, fileErrorCode.FILE_NOT_FOUND);
    }
    const response = await UserService.updateAvatar(c, user.userId, avatar);
    return responseOK(c, userSuccessMessage.UPDATE_AVATAR_SUCCESS, response);
  }

  static async updateProfile(c: Context) {
    const user = await c.get("user");
    const request = updateProfileRequest.parse(await c.req.json());
    const response = await UserService.updateProfile(c, user.userId, request);
    return responseOK(c, userSuccessMessage.UPDATE_PROFILE_SUCCESS, response);
  }

  static async followUser(c: Context) {
    const user = await c.get("user");
    const payload = followUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    await UserService.followUser(c, payload);
    return responseOK(c, userSuccessMessage.FOLLOW_USER_SUCCESS);
  }

  static async unfollowUser(c: Context) {
    const user = await c.get("user");
    const payload = followUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    await UserService.unfollowUser(c, payload);
    return responseOK(c, userSuccessMessage.UNFOLLOW_USER_SUCCESS);
  }

  static async getFollowing(c: Context) {
    const userId = c.get("user").userId;
    const targetUserId = c.req.param("userId");
    const response = await UserService.getFollowings(userId, targetUserId);
    return responseOK(c, userSuccessMessage.GET_FOLLOWINGS_SUCCESS, response);
  }

  static async getFollowers(c: Context) {
    const userId = c.get("user").userId;
    const targetUserId = c.req.param("userId");
    const response = await UserService.getFollowers(userId, targetUserId);
    return responseOK(c, userSuccessMessage.GET_FOLLOWERS_SUCCESS, response);
  }
}
