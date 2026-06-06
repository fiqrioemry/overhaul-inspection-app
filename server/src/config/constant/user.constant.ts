const userSuccessMessage = {
  FOLLOW_USER_SUCCESS: "User followed successfully",
  FOLLOW_REQUEST_SENT: "Follow request sent",
  UNFOLLOW_USER_SUCCESS: "User unfollowed successfully",
  FOLLOW_REQUEST_ACCEPTED: "Follow request accepted",
  FOLLOW_REQUEST_REJECTED: "Follow request rejected",
  SEARCH_USER_SUCCESS: "User search successful",
  GET_PROFILE_SUCCESS: "User profile retrieved successfully",
  GET_FOLLOWINGS_SUCCESS: "User followings retrieved successfully",
  GET_FOLLOWERS_SUCCESS: "User followers retrieved successfully",
  GET_FOLLOW_REQUESTS_SUCCESS: "Follow requests retrieved successfully",
  UPDATE_AVATAR_SUCCESS: "User avatar updated successfully",
  UPDATE_PROFILE_SUCCESS: "User profile updated successfully",
  UPDATE_PRIVACY_SUCCESS: "User privacy updated successfully",
  FOLLOW_REQUEST_CANCELLED: "Follow request cancelled",
  CHECK_USERNAME_SUCCESS: "Username is available",
};

const userErrorMessage = {
  NOT_FOLLOWING: "You are not following this user",
  ALREADY_FOLLOWING: "You are already following this user",
  FOLLOW_REQUEST_ALREADY_SENT: "Follow request already sent",
  CANNOT_FOLLOW_SELF: "You cannot follow yourself",
  USER_NOT_FOUND: "User not found",
  FOLLOW_REQUEST_NOT_FOUND: "Follow request not found",
  INVALID_USER_ID: "Invalid user ID",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  USERNAME_ALREADY_EXISTS: "Username already exists",
  USERNAME_TAKEN: "This username is already taken",
};

const userErrorCode = {
  NOT_FOLLOWING: "NOT_FOLLOWING",
  ALREADY_FOLLOWING: "ALREADY_FOLLOWING",
  FOLLOW_REQUEST_ALREADY_SENT: "FOLLOW_REQUEST_ALREADY_SENT",
  CANNOT_FOLLOW_SELF: "CANNOT_FOLLOW_SELF",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  FOLLOW_REQUEST_NOT_FOUND: "FOLLOW_REQUEST_NOT_FOUND",
  INVALID_USER_ID: "INVALID_USER_ID",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
  USERNAME_TAKEN: "USERNAME_TAKEN",
};

const userAction = {
  LOGIN: "login",
  LOGOUT: "logout",
  UPDATE_AVATAR: "updateAvatar",
  UPDATE_PROFILE: "updateProfile",
};

const userLimit = {
  GET_FOLLOWING: { limit: 180, windowSec: 60 },
  GET_FOLLOWERS: { limit: 180, windowSec: 60 },
  GET_PROFILE: { limit: 20, windowSec: 60 },
  UPDATE_PROFILE: { limit: 10, windowSec: 60 },
  UPDATE_AVATAR: { limit: 5, windowSec: 60 },
  SEARCH_USERS: { limit: 30, windowSec: 60 },
  CHECK_USERNAME: { limit: 60, windowSec: 60 },
  FOLLOW_REQUEST_CANCELLED: "Follow request cancelled",
  FOLLOW_USER: { limit: 20, windowSec: 60 },
  UNFOLLOW_USER: { limit: 20, windowSec: 60 },
  ACCEPT_FOLLOW_REQUEST: { limit: 60, windowSec: 60 },
  REJECT_FOLLOW_REQUEST: { limit: 60, windowSec: 60 },
  GET_FOLLOW_REQUESTS: { limit: 60, windowSec: 60 },
};

export { userSuccessMessage, userErrorMessage, userErrorCode, userAction, userLimit };
