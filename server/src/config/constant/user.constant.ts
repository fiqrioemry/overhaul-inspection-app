const userSuccessMessage = {
  FOLLOW_USER_SUCCESS: "User followed successfully",
  UNFOLLOW_USER_SUCCESS: "User unfollowed successfully",
  SEARCH_USER_SUCCESS: "User search successful",
  GET_PROFILE_SUCCESS: "User profile retrieved successfully",
  GET_FOLLOWINGS_SUCCESS: "User followings retrieved successfully",
  GET_FOLLOWERS_SUCCESS: "User followers retrieved successfully",
  UPDATE_AVATAR_SUCCESS: "User avatar updated successfully",
  UPDATE_PROFILE_SUCCESS: "User profile updated successfully",
};

const userErrorMessage = {
  NOT_FOLLOWING: "You are not following this user",
  ALREADY_FOLLOWING: "You are already following this user",
  CANNOT_FOLLOW_SELF: "You cannot follow yourself",
  USER_NOT_FOUND: "User not found",
  INVALID_USER_ID: "Invalid user ID",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  USERNAME_ALREADY_EXISTS: "Username already exists",
};

const userErrorCode = {
  NOT_FOLLOWING: "NOT_FOLLOWING",
  ALREADY_FOLLOWING: "ALREADY_FOLLOWING",
  CANNOT_FOLLOW_SELF: "CANNOT_FOLLOW_SELF",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_USER_ID: "INVALID_USER_ID",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
};

const userAction = {
  LOGIN: "login",
  LOGOUT: "logout",
  UPDATE_AVATAR: "updateAvatar",
  UPDATE_PROFILE: "updateProfile",
};

const userLimit = {
  GET_FOLLOWING: {
    limit: 180,
    windowSec: 60,
  },
  GET_FOLLOWERS: {
    limit: 180,
    windowSec: 60,
  },
  GET_PROFILE: {
    limit: 20,
    windowSec: 60,
  },
  UPDATE_PROFILE: {
    limit: 10,
    windowSec: 60,
  },
  UPDATE_AVATAR: {
    limit: 5,
    windowSec: 60,
  },

  SEARCH_USERS: {
    limit: 30,
    windowSec: 60,
  },

  FOLLOW_USER: {
    limit: 20,
    windowSec: 60,
  },

  UNFOLLOW_USER: {
    limit: 20,
    windowSec: 60,
  },
};

export { userSuccessMessage, userErrorMessage, userErrorCode, userAction, userLimit };
