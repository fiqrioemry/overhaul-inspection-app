import { Context } from "hono";
import { UserService } from "@/modules/users/user.service";
import { responseError, responseOK } from "@/utils/response";
import { userSuccessMessage } from "@/config/constant/user.constant";
import { fileErrorCode, fileErrorMessage } from "@/config/constant/file.constant";
import { blockUserRequest, followUserRequest, getFollowRequest, getFollowRequestsQuery, muteUserRequest, paginatedQuery, respondFollowRequest, unmuteUserRequest, updatePrivacyRequest, updateProfileRequest } from "@/modules/users/user.schema";

export class UserController {
  static async searchUsersByUsername(c: Context) {
    const userId = c.get("user").userId;
    const username = c.req.query("search")!;
    const response = await UserService.searchUsersByUsername(username, userId);
    return responseOK(c, userSuccessMessage.SEARCH_USER_SUCCESS, response);
  }

  static async checkUsernameAvailability(c: Context) {
    const userId = c.get("user").userId;
    const username = c.req.query("username")!;
    const response = await UserService.checkUsernameAvailability(username, userId);
    return responseOK(c, userSuccessMessage.CHECK_USERNAME_SUCCESS, response);
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

  static async blockUser(c: Context) {
    const user = c.get("user");
    const payload = blockUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    const response = await UserService.blockUser(payload);
    return responseOK(c, userSuccessMessage.BLOCK_USER_SUCCESS, response);
  }

  static async unblockUser(c: Context) {
    const user = c.get("user");
    const payload = blockUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    await UserService.unblockUser(payload);
    return responseOK(c, userSuccessMessage.UNBLOCK_USER_SUCCESS);
  }

  static async getBlockedUsers(c: Context) {
    const user = c.get("user");
    const query = paginatedQuery.parse(c.req.query());
    query.userId = user.userId;
    const response = await UserService.getBlockedUsers(query);
    return responseOK(c, userSuccessMessage.GET_BLOCKED_USERS_SUCCESS, response.data, response.meta);
  }

  static async muteUser(c: Context) {
    const user = c.get("user");
    const payload = muteUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    const response = await UserService.muteUser(payload);
    return responseOK(c, userSuccessMessage.MUTE_USER_SUCCESS, response);
  }

  static async unmuteUser(c: Context) {
    const user = c.get("user");
    const payload = unmuteUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    await UserService.unmuteUser(payload);
    return responseOK(c, userSuccessMessage.UNMUTE_USER_SUCCESS);
  }

  static async getMutedUsers(c: Context) {
    const user = c.get("user");
    const query = paginatedQuery.parse(c.req.query());
    query.userId = user.userId;
    const response = await UserService.getMutedUsers(query);
    return responseOK(c, userSuccessMessage.GET_MUTED_USERS_SUCCESS, response.data, response.meta);
  }

  static async followUser(c: Context) {
    const user = await c.get("user");
    const payload = followUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    const response = await UserService.followUser(c, payload);
    const message = response.requested ? userSuccessMessage.FOLLOW_REQUEST_SENT : userSuccessMessage.FOLLOW_USER_SUCCESS;
    return responseOK(c, message);
  }

  static async unfollowUser(c: Context) {
    const user = await c.get("user");
    const payload = followUserRequest.parse(await c.req.json());
    payload.userId = user.userId;
    const result = await UserService.unfollowUser(c, payload);
    const message = result.wasPending ? userSuccessMessage.FOLLOW_REQUEST_CANCELLED : userSuccessMessage.UNFOLLOW_USER_SUCCESS;
    return responseOK(c, message);
  }

  static async getFollowing(c: Context) {
    const userId = c.get("user").userId;
    const query = getFollowRequest.parse(c.req.query());
    query.userId = userId;
    const response = await UserService.getFollowings(query);
    return responseOK(c, userSuccessMessage.GET_FOLLOWINGS_SUCCESS, response.data, response.meta);
  }

  static async getFollowers(c: Context) {
    const userId = c.get("user").userId;
    const query = getFollowRequest.parse(c.req.query());
    query.userId = userId;
    const response = await UserService.getFollowers(query);
    return responseOK(c, userSuccessMessage.GET_FOLLOWERS_SUCCESS, response.data, response.meta);
  }

  static async updatePrivacy(c: Context) {
    const user = await c.get("user");
    const request = updatePrivacyRequest.parse(await c.req.json());
    request.userId = user.userId;
    await UserService.updatePrivacy(c, request);
    return responseOK(c, userSuccessMessage.UPDATE_PRIVACY_SUCCESS);
  }

  static async acceptFollowRequest(c: Context) {
    const user = await c.get("user");
    const payload = respondFollowRequest.parse(await c.req.json());
    payload.userId = user.userId;
    await UserService.acceptFollowRequest(c, payload);
    return responseOK(c, userSuccessMessage.FOLLOW_REQUEST_ACCEPTED);
  }

  static async rejectFollowRequest(c: Context) {
    const user = await c.get("user");
    const payload = respondFollowRequest.parse(await c.req.json());
    payload.userId = user.userId;
    await UserService.rejectFollowRequest(c, payload);
    return responseOK(c, userSuccessMessage.FOLLOW_REQUEST_REJECTED);
  }

  static async getFollowRequests(c: Context) {
    const user = await c.get("user");
    const query = getFollowRequestsQuery.parse(c.req.query());
    query.userId = user.userId;
    const response = await UserService.getFollowRequests(query);
    return responseOK(c, userSuccessMessage.GET_FOLLOW_REQUESTS_SUCCESS, response.data, response.meta);
  }
}
