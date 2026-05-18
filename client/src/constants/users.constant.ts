// src/constants/users.constant.ts
export const USERS_ENDPOINTS = {
  searchUsers: "/users",
  getUserProfile: "/users/profile/:username",
  followUser: "/users/follow",
  unfollowUser: "/users/unfollow",
  getFollowers: "/users/followers",
  getFollowing: "/users/followings",
  updateUserProfile: "/users/profile",
  updateAvatar: "/users/profile/avatar",
} as const;
