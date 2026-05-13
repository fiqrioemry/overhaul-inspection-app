// features/auth/auth.endpoints.ts
export const USERS_ENDPOINTS = {
  searchUsers: "/users/search",
  getUserProfile: "/users/:username",
  followUser: "/users/:userId/follow",
  unfollowUser: "/users/:userId/unfollow",
  updateUserProfile: "/users",
  updateAvatar: "/users/avatar",
  toggleAccountPrivacy: "/users/privacy",
} as const;
