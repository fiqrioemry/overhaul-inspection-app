/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import i18n from "@/i18n";
import { POST_KEYS } from "@/features/posts/posts.query";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SearchUsersRequest, UpdateProfileRequest } from "@/schemas/users.schema";
import type { MuteType } from "@/types/users.type";
import { searchUsers, getUserProfile, followUser, unfollowUser, updateUserProfile, updateAvatar, getFollowers, getFollowing, acceptFollowRequest, rejectFollowRequest, getFollowStatus, getFollowRequests, checkUsernameAvailability, blockUser, unblockUser, getBlockedUsers, muteUser, unmuteUser, getMutedUsers } from "@/features/users/users.api";
import { AUTH_KEYS } from "../auth/auth.query";

export const USER_KEYS = {
  all: ["users"] as const,
  followRequest: ["users", "followRequests"] as const,
  search: (query: string) => ["users", "search", query] as const,
  followers: (userId: string, search = "") => ["users", "followers", userId, search] as const,
  following: (userId: string, search = "") => ["users", "following", userId, search] as const,
  profile: (username: string) => ["users", "profile", username] as const,
  checkUsername: (username: string) => ["users", "checkUsername", username] as const,
  blocked: (page?: number) => ["users", "blocked", page] as const,
  muted: (page?: number) => ["users", "muted", page] as const,
};

export function useCheckUsername(username: string, currentUsername: string) {
  return useQuery({
    queryKey: USER_KEYS.checkUsername(username),
    queryFn: () => checkUsernameAvailability(username),
    enabled: username.trim().length >= 3 && username !== currentUsername,
    staleTime: 1000 * 30,
    retry: false,
  });
}

export function useSearchUsers(query: SearchUsersRequest) {
  return useQuery({
    queryKey: USER_KEYS.search(query.search),
    queryFn: () => searchUsers(query),
    enabled: query.search.trim().length > 0,
    staleTime: 1000 * 30,
  });
}

export function useGetFollowings(query: SearchUsersRequest, type?: "followers" | "following") {
  return useQuery({
    queryKey: USER_KEYS.following(query.targetUserId ?? "", query.search),
    queryFn: () => getFollowing(query),
    enabled: !!query.targetUserId && type === "following",
    staleTime: 1000 * 30,
    refetchOnMount: "always",
  });
}

export function useGetFollowRequests() {
  return useQuery({
    queryKey: USER_KEYS.followRequest,
    queryFn: () => getFollowRequests(),
    staleTime: 1000 * 30,
    refetchOnMount: "always",
  });
}

export function useGetFollowers(query: SearchUsersRequest, type?: "followers" | "following") {
  return useQuery({
    queryKey: USER_KEYS.followers(query.targetUserId ?? "", query.search),
    queryFn: () => getFollowers(query),
    enabled: !!query.targetUserId && type === "followers",
    staleTime: 1000 * 30,
    refetchOnMount: "always",
  });
}

export function useGetFollowStatus(userId: string) {
  return useQuery({
    queryKey: ["users", "followStatus", userId] as const,
    queryFn: () => getFollowStatus(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });
}

const followSuccessKeyMap: Record<string, string> = {
  "User followed successfully": "FOLLOW_USER_SUCCESS",
  "Follow request sent": "FOLLOW_REQUEST_SENT",
};

const unfollowSuccessKeyMap: Record<string, string> = {
  "User unfollowed successfully": "UNFOLLOW_USER_SUCCESS",
  "Follow request cancelled": "FOLLOW_REQUEST_CANCELLED",
};

export function useFollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: (res) => {
      const key = followSuccessKeyMap[res.message] ?? "FOLLOW_USER_SUCCESS";
      toast.success(i18n.t(`api:${key}`));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useUnfollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: (res) => {
      const key = unfollowSuccessKeyMap[res.message] ?? "UNFOLLOW_USER_SUCCESS";
      toast.success(i18n.t(`api:${key}`));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: USER_KEYS.profile(username),
    queryFn: () => getUserProfile(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateUserProfile(payload),
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_PROFILE_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => updateAvatar(file),
    onSuccess: () => {
      toast.success(i18n.t("api:UPDATE_AVATAR_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}

export function useAcceptFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followerId: string) => acceptFollowRequest(followerId),
    onSuccess: (_, followerId) => {
      toast.success(i18n.t("api:FOLLOW_REQUEST_ACCEPTED"));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["users", "followRequests"] });
      queryClient.invalidateQueries({ queryKey: ["users", "followStatus", followerId] });
    },
  });
}

export function useRejectFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followerId: string) => rejectFollowRequest(followerId),
    onSuccess: (_, followerId) => {
      toast.success(i18n.t("api:FOLLOW_REQUEST_REJECTED"));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["users", "followRequests"] });
      queryClient.invalidateQueries({ queryKey: ["users", "followStatus", followerId] });
    },
  });
}

export function useGetBlockedUsers(page = 1) {
  return useQuery({
    queryKey: USER_KEYS.blocked(page),
    queryFn: () => getBlockedUsers(page),
    staleTime: 1000 * 60,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => blockUser(targetUserId),
    onSuccess: () => {
      toast.success(i18n.t("api:BLOCK_USER_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.blocked() });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => unblockUser(targetUserId),
    onSuccess: () => {
      toast.success(i18n.t("api:UNBLOCK_USER_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.blocked() });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}

export function useGetMutedUsers(page = 1) {
  return useQuery({
    queryKey: USER_KEYS.muted(page),
    queryFn: () => getMutedUsers(page),
    staleTime: 1000 * 60,
  });
}

export function useMuteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUserId, muteType }: { targetUserId: string; muteType?: MuteType }) => muteUser(targetUserId, muteType),
    onSuccess: () => {
      toast.success(i18n.t("api:MUTE_USER_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.muted() });
      queryClient.invalidateQueries({ queryKey: POST_KEYS.all });
    },
  });
}

export function useUnmuteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => unmuteUser(targetUserId),
    onSuccess: () => {
      toast.success(i18n.t("api:UNMUTE_USER_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: USER_KEYS.muted() });
    },
  });
}
