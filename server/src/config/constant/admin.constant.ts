const adminSuccessMessage = {
  GET_REPORTS_SUCCESS: "Reports fetched successfully",
  UPDATE_REPORT_SUCCESS: "Report updated successfully",
  GET_USERS_SUCCESS: "Users fetched successfully",
  UPDATE_USER_STATUS_SUCCESS: "User status updated successfully",
  GET_STATS_SUCCESS: "Stats fetched successfully",
};

const adminErrorMessage = {
  REPORT_NOT_FOUND: "Report not found",
  INVALID_STATUS: "Invalid status value",
  CANNOT_CHANGE_OWN_STATUS: "You cannot change your own status",
};

const adminErrorCode = {
  REPORT_NOT_FOUND: "REPORT_NOT_FOUND",
  INVALID_STATUS: "INVALID_STATUS",
  CANNOT_CHANGE_OWN_STATUS: "CANNOT_CHANGE_OWN_STATUS",
};

const adminLimit = {
  GET_REPORTS: { limit: 120, windowSec: 60 },
  UPDATE_REPORT: { limit: 60, windowSec: 60 },
  GET_USERS: { limit: 120, windowSec: 60 },
  UPDATE_USER_STATUS: { limit: 30, windowSec: 60 },
  GET_STATS: { limit: 60, windowSec: 60 },
};

export { adminSuccessMessage, adminErrorMessage, adminErrorCode, adminLimit };
