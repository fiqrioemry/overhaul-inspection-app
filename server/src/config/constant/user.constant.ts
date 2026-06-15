const userSuccessMessage = {
  CREATE_USER_SUCCESS: "User created successfully",
  GET_USERS_SUCCESS: "Users fetched successfully",
  GET_USER_SUCCESS: "User retrieved successfully",
  UPDATE_USER_SUCCESS: "User updated successfully",
  UPDATE_USER_STATUS_SUCCESS: "User status updated successfully",
  UPDATE_USER_PASSWORD_SUCCESS: "User password updated successfully",
  DELETE_USER_SUCCESS: "User deleted successfully",
  UPDATE_AVATAR_SUCCESS: "User avatar updated successfully",
  UPDATE_PROFILE_SUCCESS: "User profile updated successfully",
};

const userErrorMessage = {
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  CANNOT_DELETE_SELF: "Cannot delete your own account",
};

const userErrorCode = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_USER_ID: "INVALID_USER_ID",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  CANNOT_DELETE_SELF: "CANNOT_DELETE_SELF",
};

const userAction = {
  LOGIN: "login",
  LOGOUT: "logout",
  CREATE_USER: "create_user",
  UPDATE_AVATAR: "update_avatar",
  UPDATE_PROFILE: "update_profile",
  UPDATE_STATUS: "update_status",
  DELETE_USER: "delete_user",
};

const userLimit = {
  GET_USERS: { limit: 60, windowSec: 60 },
  GET_PROFILE: { limit: 20, windowSec: 60 },
  UPDATE_PROFILE: { limit: 10, windowSec: 60 },
  UPDATE_AVATAR: { limit: 5, windowSec: 60 },
  SEARCH_USERS: { limit: 30, windowSec: 60 },
};

export { userSuccessMessage, userErrorMessage, userErrorCode, userAction, userLimit };
