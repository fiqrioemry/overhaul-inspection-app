const tankProcessSuccessMessage = {
  GET_PROCESS: "Process retrieved successfully",
  UPDATE_PROCESS_STATUS: "Process status updated successfully",
  COMPLETE_PROCESS_DIRECT: "Process marked as completed",
  CORRECT_PROCESS_STATUS: "Process status corrected successfully",
  UPDATE_PROCESS_DATES: "Process dates updated successfully",
  GET_ELIGIBILITY: "Eligibility checked successfully",
  GET_CHECKLIST: "Checklist retrieved successfully",
  DELETE_PROCESS: "Process removed from project successfully",
};

// Safe message for a lost optimistic-concurrency race — the client re-reads and retries.
const tankProcessErrorMessage = {
  STALE_PROCESS_STATUS: "Process status has changed. Refresh the data and try again.",
};

// UserActivityLog.action values. Lowercase snake_case to match userAction
// (src/config/constant/user.constant.ts), which is what the activity log already stores.
const tankProcessAction = {
  MANUAL_STATUS_CORRECTION: "manual_status_correction",
};

export { tankProcessSuccessMessage, tankProcessErrorMessage, tankProcessAction };
