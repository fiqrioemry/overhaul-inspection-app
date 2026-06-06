import qs from "qs";
import api from "@/lib/axios";
import { USERS_ENDPOINTS } from "@/constants/users.constant";
import type { UserProfile, User, UpdatePrivacyRequest } from "@/types/users.type";
import type { ResponseOK, ResponseSuccess } from "@/types/response.type";
import type { SearchUsersRequest, UpdateProfileRequest } from "@/schemas/users.schema";

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
