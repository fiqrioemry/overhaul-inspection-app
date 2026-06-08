const authSuccessMessage = {
  REGISTER_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "User logged in successfully",
  LOGOUT_SUCCESS: "User logged out successfully",
  EMAIL_VERIFICATION_SUCCESS: "Email verified successfully",
  GET_SESSIONS_SUCCESS: "Sessions fetched successfully",
  DELETE_SESSION_SUCCESS: "Session deleted successfully",
  CHANGE_PASSWORD_SUCCESS: "Password changed successfully",
  SET_PASSWORD_SUCCESS: "Password set successfully",
  RESET_PASSWORD_SUCCESS: "Password reset successfully",
  FORGOT_PASSWORD_SUCCESS: "Password reset link sent successfully",
  RESEND_VERIFICATION_EMAIL_SUCCESS: "Verification email resent successfully",
  GET_ME_SUCCESS: "User fetched successfully",
  LOGOUT_ALL_SUCCESS: "All sessions logged out successfully",
  TWO_FACTOR_SETUP_SUCCESS: "2FA setup initiated",
  TWO_FACTOR_ENABLED: "2FA enabled successfully",
  TWO_FACTOR_DISABLED: "2FA disabled successfully",
  TWO_FACTOR_CHALLENGE_PASSED: "2FA verified successfully",
};

const authErrorMessage = {
  BAD_REQUEST: "Bad request",
  SESSION_REVOKED: "Session has been revoked",
  EMAIL_EXISTS: "Email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  USER_CREATION_FAILED: "User creation failed",
  TOKEN_REQUIRED: "Token is required",
  INVALID_TOKEN: "Invalid token",
  EMAIL_NOT_VERIFIED: "Email not verified",
  ACCOUNT_BANNED: "Account banned",
  SESSION_NOT_FOUND: "Session not found",
  EMAIL_ALREADY_VERIFIED: "Email is already verified",
  INTERNAL_SERVER_ERROR: "Internal server error",
  ROUTE_NOT_FOUND: "Route not found",
  OAUTH_FAILED: "OAuth authentication failed",
  OAUTH_EMAIL_NOT_PROVIDED: "Email not provided by OAuth provider",
  OAUTH_STATE_INVALID: "Invalid OAuth state, possible CSRF attack",
  TWO_FACTOR_NOT_ENABLED: "2FA is not enabled on this account",
  TWO_FACTOR_ALREADY_ENABLED: "2FA is already enabled",
  TWO_FACTOR_INVALID_CODE: "Invalid or expired 2FA code",
  TWO_FACTOR_SETUP_REQUIRED: "Complete 2FA setup before verifying",
  TWO_FACTOR_CHALLENGE_INVALID: "Invalid or expired 2FA challenge",
  TWO_FACTOR_REQUIRED: "2FA verification required",
  NO_PASSWORD_SET: "This account has no password. Use set-password instead.",
  PASSWORD_ALREADY_SET: "A password is already set. Use change-password instead.",
};

const authErrorCode = {
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  FORBIDDEN: "FORBIDDEN",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  SESSION_REVOKED: "SESSION_REVOKED",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_CREATION_FAILED: "USER_CREATION_FAILED",
  TOKEN_REQUIRED: "TOKEN_REQUIRED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_BANNED: "ACCOUNT_BANNED",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED",
  OAUTH_FAILED: "OAUTH_FAILED",
  OAUTH_EMAIL_NOT_PROVIDED: "OAUTH_EMAIL_NOT_PROVIDED",
  OAUTH_STATE_INVALID: "OAUTH_STATE_INVALID",
  TWO_FACTOR_NOT_ENABLED: "TWO_FACTOR_NOT_ENABLED",
  TWO_FACTOR_ALREADY_ENABLED: "TWO_FACTOR_ALREADY_ENABLED",
  TWO_FACTOR_INVALID_CODE: "TWO_FACTOR_INVALID_CODE",
  TWO_FACTOR_SETUP_REQUIRED: "TWO_FACTOR_SETUP_REQUIRED",
  TWO_FACTOR_CHALLENGE_INVALID: "TWO_FACTOR_CHALLENGE_INVALID",
  TWO_FACTOR_REQUIRED: "TWO_FACTOR_REQUIRED",
  NO_PASSWORD_SET: "NO_PASSWORD_SET",
  PASSWORD_ALREADY_SET: "PASSWORD_ALREADY_SET",
};

const authLimit = {
  OAUTH_STATE_TTL: 10 * 60, // 10 minutes in seconds
  VERIFY_EMAIL_EXP: 60 * 60 * 1000,
  RESET_PASSWORD_EXP: 60 * 60 * 1000,
  FORGOT_PASSWORD_EXP: 60 * 60 * 1000,
  SESSION_TOKEN_EXP: 24 * 60 * 60 * 1000, // 24 hours

  LOGIN: {
    limit: 5, // limit each IP to 5 login requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  SESSIONS: {
    limit: 100, // limit each user to 100 active sessions
    windowSec: 60, // Per 60 secs hit 100 times
  },

  REGISTER: {
    limit: 10, // limit each IP to 10 registration requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  PASSWORD_CHANGE: {
    limit: 5, // limit each user to 5 password change requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  PASSWORD_FORGOT: {
    limit: 3, // limit each IP to 3 password reset requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  PASSWORD_RESET: {
    limit: 3, // limit each IP to 3 password reset requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  VERIFY_EMAIL: {
    limit: 5, // limit each IP to 5 email verification requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  GET_ME: {
    limit: 60,
    windowSec: 60, // 60 seconds in seconds
  },

  RESEND_VERIFICATION_EMAIL: {
    limit: 3,
    windowSec: 60,
  },

  PASSWORD_SET: {
    limit: 5,
    windowSec: 60,
  },
  TWO_FACTOR_SETUP: { limit: 5, windowSec: 60 },
  TWO_FACTOR_VERIFY: { limit: 10, windowSec: 60 },
  TWO_FACTOR_DISABLE: { limit: 5, windowSec: 60 },
  TWO_FACTOR_CHALLENGE: { limit: 10, windowSec: 60 },

  TWO_FACTOR_CHALLENGE_TTL: 5 * 60, // 5 minutes in seconds
  TWO_FACTOR_SETUP_TTL: 10 * 60,   // 10 minutes in seconds
};

export { authSuccessMessage, authErrorMessage, authErrorCode, authLimit };
