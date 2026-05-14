const commentAction = {
  CREATE_COMMENT: "commentCreate",
  UPDATE_COMMENT: "commentUpdate",
  DELETE_COMMENT: "commentDelete",
};

const commentSuccessMessage = {
  CREATE_COMMENT_SUCCESS: "Comment created successfully",
  GET_COMMENT_SUCCESS: "Comments retrieved successfully",
  GET_REPLIES_SUCCESS: "Replies retrieved successfully",
  UPDATE_COMMENT_SUCCESS: "Comment updated successfully",
  DELETE_COMMENT_SUCCESS: "Comment deleted successfully",
  LIKE_COMMENT_SUCCESS: "Comment liked successfully",
  UNLIKE_COMMENT_SUCCESS: "Comment unliked successfully",
};

const commentErrorCode = {
  COMMENT_NOT_FOUND: "COMMENT_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CONTENT: "INVALID_CONTENT",
  ALREADY_LIKED_COMMENT: "ALREADY_LIKED_COMMENT",
  LIKE_NOT_FOUND: "LIKE_NOT_FOUND",
  CANNOT_REPLY_TO_REPLY: "CANNOT_REPLY_TO_REPLY",
};

const commentErrorMessage = {
  COMMENT_NOT_FOUND: "Comment not found.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  INVALID_CONTENT: "Comment content is invalid.",
  ALREADY_LIKED_COMMENT: "Comment already liked by the user.",
  LIKE_NOT_FOUND: "Like not found for the user on this comment.",
  CANNOT_REPLY_TO_REPLY: "Cannot reply to a reply.",
};

export { commentAction, commentSuccessMessage, commentErrorCode, commentErrorMessage };
