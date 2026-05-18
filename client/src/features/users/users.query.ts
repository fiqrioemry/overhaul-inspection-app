/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { POST_KEYS } from "@/features/posts/posts.query";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SearchUsersRequest, UpdateProfileRequest } from "@/schemas/users.schema";
import { searchUsers, getUserProfile, followUser, unfollowUser, updateUserProfile, updateAvatar, getFollowers, getFollowing } from "@/features/users/users.api";
import { AUTH_KEYS } from "../auth/auth.query";

export const USER_KEYS = {
  all: ["users"] as const,
  search: (query: string) => ["users", "search", query] as const,
  followers: (userId: string, search = "") => ["users", "followers", userId, search] as const,
  following: (userId: string, search = "") => ["users", "following", userId, search] as const,
  profile: (username: string) => ["users", "profile", username] as const,
};

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

export function useGetFollowers(query: SearchUsersRequest, type?: "followers" | "following") {
  return useQuery({
    queryKey: USER_KEYS.followers(query.targetUserId ?? "", query.search),
    queryFn: () => getFollowers(query),
    enabled: !!query.targetUserId && type === "followers",
    staleTime: 1000 * 30,
    refetchOnMount: "always",
  });
}
export function useFollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: (res) => {
      toast.success(res.message);
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
      toast.success(res.message);
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
    onSuccess: (res) => {
      toast.success(res.message || "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => updateAvatar(file),
    onSuccess: (res) => {
      toast.success(res.message || "Avatar updated successfully");
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}
