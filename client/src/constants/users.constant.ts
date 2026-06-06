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
  updatePrivacy: "/users/profile/privacy",
  getFollowRequests: "/users/follow/requests",
  acceptFollowRequest: "/users/follow/accept",
  rejectFollowRequest: "/users/follow/reject",
  getFollowStatus: "/users/:userId/follow-status",
  checkUsername: "/users/check-username",
} as const;
