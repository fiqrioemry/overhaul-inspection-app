const fileSuccessMessage = {
  UPLOAD_FILE_SUCCESS: "File uploaded successfully",
  DELETE_FILE_SUCCESS: "File deleted successfully",
};

const fileErrorMessage = {
  FILE_ID_REQUIRED: "File ID is required",
  FILE_NOT_FOUND: "File not found",
  FILE_UPLOAD_FAILED: "File upload failed",
  FILE_DELETE_FAILED: "File delete failed",
  FILE_TYPE_NOT_ALLOWED: "File type not allowed",
  FILE_TOO_LARGE: "File size exceeds the allowed limit",
};

const fileErrorCode = {
  FILE_ID_REQUIRED: "FILE_ID_REQUIRED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  FILE_DELETE_FAILED: "FILE_DELETE_FAILED",
  FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
};

const fileLimit = {
  UNUSED_AVATAR_EXP: 1 * 60 * 60, // 24 hours in seconds
  SINGLE_FILE: {
    limit: 60, // limit each IP to 5 login requests per windowSec
    windowSec: 60, // 60 seconds in seconds
  },

  MULTIPLE_FILE: {
    limit: 100, // limit each user to 100 active sessions
    windowSec: 60, // Per 60 secs hit 100 times
  },

  CHAT_FILE_OPTIONS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4", "audio/mpeg"],
  },

  FILE_OPTIONS: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },

  AVATAR_OPTIONS: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ["image/jpeg", "image/png"],
  },

  POST_FILE_OPTIONS: {
    maxSize: 8 * 1024 * 1024, // 8MB per file
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};

export { fileSuccessMessage, fileErrorMessage, fileErrorCode, fileLimit };
