import qs from "qs";
import api from "@/lib/axios";
import { USERS_ENDPOINTS } from "@/constants/users.constant";
import type { UserProfile, User, UpdatePrivacyRequest, BlockData, BlockedUser, MuteData, MutedUser } from "@/types/users.type";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { SearchUsersRequest, UpdateProfileRequest } from "@/schemas/users.schema";
import type { MuteType } from "@/types/users.type";

export async function searchUsers(query: SearchUsersRequest): Promise<ResponseSuccess<User[]>> {
  const res = await api.get(USERS_ENDPOINTS.searchUsers + "?search=" + query.search);
  return res.data;
}

export async function getUserProfile(username: string): Promise<ResponseSuccess<UserProfile>> {
  const res = await api.get(USERS_ENDPOINTS.getUserProfile.replace(":username", username));
  return res.data;
}

export async function followUser(userId: string): Promise<ResponseOK> {
  const res = await api.post(USERS_ENDPOINTS.followUser, { targetUserId: userId });
  return res.data;
}

export async function unfollowUser(userId: string): Promise<ResponseOK> {
  const res = await api.post(USERS_ENDPOINTS.unfollowUser, { targetUserId: userId });
  return res.data;
}

export async function getFollowers(query: SearchUsersRequest): Promise<ResponseSuccess<User[]>> {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(USERS_ENDPOINTS.getFollowers + "?" + queryString);
  return res.data;
}

export async function getFollowing(query: SearchUsersRequest): Promise<ResponseSuccess<User[]>> {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(USERS_ENDPOINTS.getFollowing + "?" + queryString);
  return res.data;
}

export async function updateUserProfile(payload: UpdateProfileRequest): Promise<ResponseOK> {
  const res = await api.put(USERS_ENDPOINTS.updateUserProfile, payload);
  return res.data;
}

export async function updateAvatar(file: File): Promise<ResponseOK> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await api.patch(USERS_ENDPOINTS.updateAvatar, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function updatePrivacy(data: UpdatePrivacyRequest): Promise<ResponseOK> {
  const res = await api.patch(USERS_ENDPOINTS.updatePrivacy, data);
  return res.data;
}

export async function getFollowRequests(): Promise<ResponseSuccess<User[]>> {
  const res = await api.get(USERS_ENDPOINTS.getFollowRequests);
  return res.data;
}

export async function acceptFollowRequest(followerId: string): Promise<ResponseOK> {
  const res = await api.post(USERS_ENDPOINTS.acceptFollowRequest, { followerId });
  return res.data;
}

export async function rejectFollowRequest(followerId: string): Promise<ResponseOK> {
  const res = await api.post(USERS_ENDPOINTS.rejectFollowRequest, { followerId });
  return res.data;
}

export async function getFollowStatus(userId: string): Promise<ResponseSuccess<{ followStatus: "ACCEPTED" | "PENDING" | "NONE" }>> {
  const res = await api.get(USERS_ENDPOINTS.getFollowStatus.replace(":userId", userId));
  return res.data;
}

export async function checkUsernameAvailability(username: string): Promise<ResponseSuccess<{ available: boolean }>> {
  const res = await api.get(`${USERS_ENDPOINTS.checkUsername}?username=${encodeURIComponent(username)}`);
  return res.data;
}

export async function blockUser(targetUserId: string): Promise<ResponseSuccess<BlockData>> {
  const res = await api.post(USERS_ENDPOINTS.blockUser, { targetUserId });
  return res.data;
}

export async function unblockUser(targetUserId: string): Promise<ResponseOK> {
  const res = await api.delete(USERS_ENDPOINTS.unblockUser, { data: { targetUserId } });
  return res.data;
}

export async function getBlockedUsers(page = 1, limit = 10): Promise<ResponseSuccess<BlockedUser[]>> {
  const queryString = qs.stringify({ page, limit }, { skipNulls: true });
  const res = await api.get(`${USERS_ENDPOINTS.getBlockedUsers}?${queryString}`);
  return res.data;
}

export async function muteUser(targetUserId: string, muteType: MuteType = "all"): Promise<ResponseSuccess<MuteData>> {
  const res = await api.post(USERS_ENDPOINTS.muteUser, { targetUserId, muteType });
  return res.data;
}

export async function unmuteUser(targetUserId: string): Promise<ResponseOK> {
  const res = await api.delete(USERS_ENDPOINTS.unmuteUser, { data: { targetUserId } });
  return res.data;
}

export async function getMutedUsers(page = 1, limit = 10): Promise<ResponseSuccess<MutedUser[]>> {
  const queryString = qs.stringify({ page, limit }, { skipNulls: true });
  const res = await api.get(`${USERS_ENDPOINTS.getMutedUsers}?${queryString}`);
  return res.data;
}
