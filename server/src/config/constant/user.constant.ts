const userSuccessMessage = {
  GET_USERS_SUCCESS: "Users fetched successfully",
  USER_SEARCH_SUCCESS: "User search successful",
  UPDATE_AVATAR_SUCCESS: "User avatar updated successfully",
  UPDATE_PROFILE_SUCCESS: "User profile updated successfully",
};

const userErrorMessage = {
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "Email already exists",
};

const userErrorCode = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_USER_ID: "INVALID_USER_ID",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
};

const userAction = {
  LOGIN: "login",
  LOGOUT: "logout",
  UPDATE_AVATAR: "updateAvatar",
  UPDATE_PROFILE: "updateProfile",
};

const userLimit = {
  GET_PROFILE: { limit: 20, windowSec: 60 },
  UPDATE_PROFILE: { limit: 10, windowSec: 60 },
  UPDATE_AVATAR: { limit: 5, windowSec: 60 },
  SEARCH_USERS: { limit: 30, windowSec: 60 },
};

export { userSuccessMessage, userErrorMessage, userErrorCode, userAction, userLimit };
